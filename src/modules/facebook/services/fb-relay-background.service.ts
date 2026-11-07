import { RUN_FUNC } from "src/constants"

/**
 * Service-worker relays for Facebook requests the sidebar cannot make itself:
 * cross-origin hosts (upload / rupload / vupload), raw binary bodies, and
 * acting as a Page (the `i_user` cookie is swapped for one request, then
 * restored). Shared by the external web bridge and Bluemaster's own tools.
 */

const FB_URL = "https://www.facebook.com"

const setIUserCookie = (pageId: string): Promise<string | null> =>
  new Promise((resolve) => {
    chrome.cookies.get({ url: FB_URL, name: "i_user" }, (old) => {
      chrome.cookies.set(
        {
          url: FB_URL,
          name: "i_user",
          value: pageId,
          domain: ".facebook.com",
          path: "/",
          secure: true,
          sameSite: "lax",
          expirationDate: Math.floor(Date.now() / 1000) + 365 * 24 * 3600
        },
        () => resolve(old?.value ?? null)
      )
    })
  })

const restoreIUserCookie = (old: string | null): Promise<void> =>
  new Promise((resolve) => {
    if (old) {
      chrome.cookies.set(
        {
          url: FB_URL,
          name: "i_user",
          value: old,
          domain: ".facebook.com",
          path: "/",
          secure: true,
          sameSite: "lax",
          expirationDate: Math.floor(Date.now() / 1000) + 365 * 24 * 3600
        },
        () => resolve()
      )
    } else {
      chrome.cookies.remove({ url: FB_URL, name: "i_user" }, () => resolve())
    }
  })

/**
 * Serialises every Page-identity request: the `i_user` cookie is global, so two
 * overlapping swaps would restore each other's value and could leave the
 * browser acting as a Page. Requests without `pageId` are not queued.
 */
let pageQueue: Promise<unknown> = Promise.resolve()

/** Runs `fn` with the `i_user` cookie set to `pageId` (when given), restoring it afterwards. */
function asPage<T>(
  pageId: string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  if (!pageId) return fn()
  const run = pageQueue.then(async () => {
    const old = await setIUserCookie(pageId)
    try {
      return await fn()
    } finally {
      await restoreIUserCookie(old)
    }
  })
  pageQueue = run.catch(() => undefined)
  return run
}

const base64ToBytes = (data: string) =>
  Uint8Array.from(atob(data.includes(",") ? data.split(",")[1] : data), (c) =>
    c.charCodeAt(0)
  )

export interface RelayFetchResult {
  ok: boolean
  status: number
  statusText: string
  body: string
  url: string
  headers: Record<string, string>
}

/** Credentialed fetch; binary responses come back as a base64 data URL. */
export async function bgFetch(
  url: string,
  options?: RequestInit & { iUser?: string }
): Promise<RelayFetchResult> {
  const { iUser, ...init } = options ?? {}
  const res = await asPage(iUser, () => fetch(url, init))
  const contentType = res.headers.get("Content-Type") ?? ""
  const isTextual =
    contentType.startsWith("text/") ||
    contentType.includes("json") ||
    contentType.includes("javascript") ||
    contentType.includes("xml")
  let body: string
  if (isTextual) {
    body = await res.text()
  } else {
    const bytes = new Uint8Array(await res.arrayBuffer())
    let binary = ""
    for (let i = 0; i < bytes.length; i++)
      binary += String.fromCharCode(bytes[i])
    body = `data:${contentType || "application/octet-stream"};base64,${btoa(binary)}`
  }
  const headers: Record<string, string> = {}
  res.headers.forEach((v, k) => (headers[k] = v))
  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    body,
    url: res.url,
    headers
  }
}

interface UploadMediaPayload {
  url: string
  filesBase64: { fieldName: string; name: string; type: string; data: string }[]
  formFields?: Record<string, string>
  headers?: Record<string, string>
  iUser?: string
}

/** Multipart upload (photos / attachments) built from base64 files. */
async function uploadMedia({
  url,
  filesBase64,
  formFields,
  headers,
  iUser
}: UploadMediaPayload) {
  const formData = new FormData()
  for (const [k, v] of Object.entries(formFields ?? {})) formData.append(k, v)
  for (const f of filesBase64) {
    formData.append(
      f.fieldName,
      new Blob([base64ToBytes(f.data)], {
        type: f.type || "application/octet-stream"
      }),
      f.name
    )
  }
  const res = await asPage(iUser, () =>
    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: headers ?? {},
      body: formData
    })
  )
  return { ok: res.ok, status: res.status, body: await res.text() }
}

/** Raw octet-stream video chunk upload to rupload (GET probe first, like Facebook's web client). */
async function uploadVideoChunk({
  url,
  chunkBase64,
  headers
}: {
  url: string
  chunkBase64: string
  headers?: Record<string, string>
}) {
  await fetch(url, { method: "GET", credentials: "include" }).catch(() => null)
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/octet-stream", ...headers },
    body: base64ToBytes(chunkBase64)
  })
  return { ok: res.ok, status: res.status, body: await res.text() }
}

const respond = (
  p: Promise<unknown>,
  sendResponse: (r?: unknown) => void,
  onError: (e: Error) => unknown
): true => {
  p.then(sendResponse).catch((e) => sendResponse(onError(e)))
  return true
}

/**
 * Handles relay messages; returns `true` (async response) when the message was
 * one of ours, `undefined` otherwise so the caller can keep dispatching.
 */
export function handleFbRelayMessage(
  request: {
    action?: string
    fnPath?: string
    params?: unknown[]
    payload?: any
  },
  sendResponse: (response?: unknown) => void,
  /** Allow `chrome.*` calls: only for the external web bridge, never for content scripts */
  allowChromeApi = false
): true | undefined {
  const failed = (e: Error) => ({
    ok: false,
    status: 0,
    body: "",
    error: e.message
  })

  if (request.action === RUN_FUNC) {
    const { fnPath = "", params = [] } = request
    if (fnPath === "customFetch") {
      const [url, opts] = params as [
        string,
        (RequestInit & { iUser?: string })?
      ]
      return respond(bgFetch(url, opts), sendResponse, () => null)
    }
    // Generic chrome.* dispatcher (used by the external web bridge)
    if (allowChromeApi && fnPath.startsWith("chrome.")) {
      let fn: unknown = chrome
      for (const part of fnPath.split(".").slice(1))
        fn = (fn as Record<string, unknown>)?.[part]
      if (typeof fn === "function") {
        return respond(
          Promise.resolve().then(() =>
            (fn as (...a: unknown[]) => unknown)(...params)
          ),
          sendResponse,
          () => null
        )
      }
    }
    sendResponse(null)
    return true
  }
  if (request.action === "INBOX_UPLOAD_MEDIA")
    return respond(uploadMedia(request.payload ?? {}), sendResponse, failed)
  if (request.action === "UPLOAD_VIDEO_CHUNK")
    return respond(
      uploadVideoChunk(request.payload ?? {}),
      sendResponse,
      failed
    )
  return undefined
}
