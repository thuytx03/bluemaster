import { DOWNLOAD_ROOT_FOLDER } from "src/constants/download.constants"
import { ERemoteMessageType } from "src/constants/enum"
import { chromeUtils } from "src/utils/chrome.util"
import { joinPath, sanitizeFilename } from "src/utils/file.util"
import { createZipBlob, IZipEntry } from "src/utils/zip.util"

export type TSaveMode = "files" | "zip"

/**
 * Where downloaded media ends up. "files" hands every item to Chrome
 * (one download per file). "zip" keeps everything in memory and writes a
 * single archive at the end, so the browser asks only once.
 */
export interface IMediaSink {
  readonly mode: TSaveMode
  /** `filename` is relative to the extension's download root folder */
  save: (url: string, filename: string) => Promise<void>
  /** Flush pending work (writes the archive in zip mode). Safe to call twice. */
  finish: () => Promise<void>
  /** Number of items collected so far */
  readonly size: number
}

/** Hard cap so a huge profile cannot exhaust the tab's memory */
const MAX_ZIP_TOTAL_BYTES = 1.5 * 1024 * 1024 * 1024

const base64ToBytes = (dataUrl: string): Uint8Array => {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

const fetchViaBackground = (url: string) =>
  new Promise<Uint8Array>((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: ERemoteMessageType.FETCH_BINARY, url },
      (response) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message))
        if (!response?.ok || typeof response.body !== "string") {
          return reject(new Error(response?.error || `HTTP ${response?.status ?? "?"}`))
        }
        resolve(base64ToBytes(response.body))
      }
    )
  })

/** Fetch media bytes: direct fetch first (fbcdn allows CORS), background as fallback. */
export const fetchMediaBytes = async (url: string): Promise<Uint8Array> => {
  if (url.startsWith("data:")) return base64ToBytes(url)
  try {
    const res = await fetch(url, { credentials: "omit" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return new Uint8Array(await res.arrayBuffer())
  } catch (directError) {
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) throw directError
    return fetchViaBackground(url)
  }
}

const filesSink = (): IMediaSink => {
  let count = 0
  return {
    mode: "files",
    get size() {
      return count
    },
    save: async (url, filename) => {
      await chromeUtils.downloadFile({ url, filename: joinPath(DOWNLOAD_ROOT_FOLDER, filename) })
      count += 1
    },
    finish: async () => {}
  }
}

const zipSink = (zipName: string): IMediaSink => {
  const entries: IZipEntry[] = []
  const seen = new Set<string>()
  let totalBytes = 0
  let finished = false

  const uniqueName = (name: string) => {
    if (!seen.has(name)) {
      seen.add(name)
      return name
    }
    const dot = name.lastIndexOf(".")
    const base = dot > 0 ? name.slice(0, dot) : name
    const ext = dot > 0 ? name.slice(dot) : ""
    for (let i = 1; ; i++) {
      const candidate = `${base} (${i})${ext}`
      if (!seen.has(candidate)) {
        seen.add(candidate)
        return candidate
      }
    }
  }

  return {
    mode: "zip",
    get size() {
      return entries.length
    },
    save: async (url, filename) => {
      let data: Uint8Array
      try {
        data = await fetchMediaBytes(url)
      } catch (error) {
        // Could not read the bytes: fall back to a regular download for this one file
        await chromeUtils.downloadFile({ url, filename: joinPath(DOWNLOAD_ROOT_FOLDER, filename) })
        return
      }
      if (totalBytes + data.length > MAX_ZIP_TOTAL_BYTES) {
        throw new Error("ZIP quá lớn (hơn 1,5 GB). Hãy chọn lưu từng file hoặc thu hẹp khoảng thời gian.")
      }
      totalBytes += data.length
      entries.push({ name: uniqueName(filename), data, mtime: new Date() })
    },
    finish: async () => {
      if (finished || entries.length === 0) return
      finished = true
      const blob = createZipBlob(entries)
      const url = URL.createObjectURL(blob)
      try {
        await chromeUtils.downloadFile({
          url,
          filename: joinPath(DOWNLOAD_ROOT_FOLDER, `${sanitizeFilename(zipName) || "download"}.zip`)
        })
      } finally {
        // give Chrome a moment to open the blob before revoking it
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
        entries.length = 0
      }
    }
  }
}

export const createMediaSink = (mode: TSaveMode, zipName: string): IMediaSink =>
  mode === "zip" ? zipSink(zipName) : filesSink()
