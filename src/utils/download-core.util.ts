/**
 * Download primitives built directly on chrome.downloads.
 * Usable from any context that has the `downloads` permission available
 * (background service worker, options page). Content scripts go through
 * the background via chromeUtils.downloadFile.
 */

export interface IDownloadFileConfig {
  /** Resolve only when Chrome reports the download as complete (default true) */
  waitUntilCompleted?: boolean
  /** How many times to restart a failed download from scratch (default 1) */
  retryCount?: number
  /** How many times to call chrome.downloads.resume on a resumable interruption */
  maxResumeAttempts?: number
  delayBetweenRetriesMs?: number
}

export interface IDownloadFileRequest extends IDownloadFileConfig {
  url: string
  filename?: string
  conflictAction?: chrome.downloads.DownloadOptions["conflictAction"]
  saveAs?: boolean
}

export class ChromeDownloadException extends Error {
  readonly isCancelledByUser: boolean
  readonly canResume: boolean

  constructor(
    message: string,
    options: { isCancelledByUser?: boolean; canResume?: boolean } = {}
  ) {
    super(message)
    this.name = "ChromeDownloadException"
    this.isCancelledByUser = !!options.isCancelledByUser
    this.canResume = !!options.canResume
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const startDownload = (options: chrome.downloads.DownloadOptions) =>
  new Promise<number>((resolve, reject) => {
    chrome.downloads.download(options, (downloadId) => {
      if (chrome.runtime.lastError || downloadId === undefined) {
        reject(
          new ChromeDownloadException(
            chrome.runtime.lastError?.message || "Download could not be started"
          )
        )
        return
      }
      resolve(downloadId)
    })
  })

const searchDownload = (id: number) =>
  new Promise<chrome.downloads.DownloadItem | undefined>((resolve) => {
    chrome.downloads.search({ id }, (items) => resolve(items?.[0]))
  })

const resumeDownload = (id: number) =>
  new Promise<void>((resolve) => {
    chrome.downloads.resume(id, () => {
      // swallow lastError: a failed resume is handled by the state listener
      void chrome.runtime.lastError
      resolve()
    })
  })

/** Wait until the given download completes or is interrupted. */
const waitForDownload = (downloadId: number) =>
  new Promise<void>((resolve, reject) => {
    const settle = async (state: string) => {
      chrome.downloads.onChanged.removeListener(onChanged)
      if (state === "complete") {
        resolve()
        return
      }
      const item = await searchDownload(downloadId)
      const error = item?.error ?? "Download interrupted"
      if (error === "USER_CANCELED") {
        reject(new ChromeDownloadException(error, { isCancelledByUser: true }))
      } else if (item?.canResume) {
        reject(new ChromeDownloadException(error, { canResume: true }))
      } else {
        reject(new ChromeDownloadException(error))
      }
    }
    const onChanged = (delta: chrome.downloads.DownloadDelta) => {
      if (delta.id !== downloadId) return
      const state = delta.state?.current
      if (state === "complete" || state === "interrupted") void settle(state)
    }
    chrome.downloads.onChanged.addListener(onChanged)
    // The download may already be finished by the time we subscribe.
    void searchDownload(downloadId).then((item) => {
      if (item && (item.state === "complete" || item.state === "interrupted")) {
        void settle(item.state)
      }
    })
  })

/**
 * Download with retry + resume semantics:
 *  - a failed `chrome.downloads.download` call is retried `retryCount` times
 *  - a resumable interruption is resumed up to `maxResumeAttempts` times
 *  - a user cancellation is never retried
 */
export const downloadFileWithChromeApi = async (
  request: IDownloadFileRequest
): Promise<string> => {
  const {
    waitUntilCompleted = true,
    retryCount = 1,
    maxResumeAttempts = Number.POSITIVE_INFINITY,
    delayBetweenRetriesMs = 1000,
    ...rest
  } = request
  // Never open the "Save as" dialog, even when Chrome's "Ask where to save each file"
  // setting is on, and silently rename duplicates instead of prompting.
  const downloadOptions: chrome.downloads.DownloadOptions = {
    saveAs: false,
    conflictAction: "uniquify",
    ...rest
  }

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    if (attempt > 0) await sleep(delayBetweenRetriesMs)

    let downloadId: number
    try {
      downloadId = await startDownload(downloadOptions)
    } catch (error) {
      if (attempt < retryCount) continue
      throw error
    }
    if (!waitUntilCompleted) return "started"

    let resumeAttempts = 0
    let shouldRestart = false
    while (true) {
      try {
        await waitForDownload(downloadId)
        return "completed"
      } catch (error) {
        const e = error as ChromeDownloadException
        if (e.isCancelledByUser) throw e
        if (e.canResume && resumeAttempts < maxResumeAttempts) {
          resumeAttempts += 1
          await resumeDownload(downloadId)
          continue
        }
        if (attempt < retryCount) {
          shouldRestart = true
          break
        }
        throw e
      }
    }
    if (shouldRestart) continue
  }
  throw new ChromeDownloadException("Download failed after maximum retries")
}

/**
 * For media the browser refuses to download directly: fetch it here
 * (with credentials) and hand Chrome a data: URL instead.
 */
export const downloadForbiddenMediaWithChromeApi = async (
  mediaUrl: string,
  filename: string | undefined,
  config: IDownloadFileConfig = {}
) => {
  const res = await fetch(mediaUrl, { credentials: "include" })
  if (!res.ok) throw new Error(`HTTP ${res.status} while fetching media`)
  const blob = await res.blob()
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Failed to encode media"))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  return downloadFileWithChromeApi({ url: dataUrl, filename, ...config })
}
