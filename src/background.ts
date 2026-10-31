import { ERemoteMessageType } from "src/constants/enum"

import { rules } from "src/constants/rules.constants"
import {
  ensureInboxConfig,
  fetchBusinessInboxConfig,
  fetchPageListInbox,
  fetchUsersInboxBg,
  getInboxRequestConfig
} from "src/modules/inbox/services/inbox-background.service"
import facebookService from "src/modules/facebook/services/facebook.service"
import {
  isUpdateNotification,
  openDownloadPage,
  runVersionCheck,
  scheduleVersionCheckAlarm,
  VERSION_CHECK_ALARM
} from "src/modules/shared/services/version-check.service"
import {
  downloadFileWithChromeApi,
  downloadForbiddenMediaWithChromeApi
} from "src/utils/download-core.util"
import { RUN_FUNC } from "src/constants"

async function bgFetch(
  url: string,
  options?: RequestInit
): Promise<{
  ok: boolean
  status: number
  statusText: string
  body: string
  url: string
  headers: Record<string, string>
}> {
  const res = await fetch(url, options)
  let body = ""
  const contentType = res.headers.get("Content-Type") ?? ""
  const isTextual =
    contentType.startsWith("text/") ||
    contentType.includes("json") ||
    contentType.includes("javascript") ||
    contentType.includes("xml")
  if (isTextual) {
    body = await res.text()
  } else {
    // Binary content (image/video/audio/etc.) — return as base64 data URL
    const buffer = await res.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ""
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    const mime = contentType || "application/octet-stream"
    body = `data:${mime};base64,${btoa(binary)}`
  }
  const headers: Record<string, string> = {}
  res.headers.forEach((v, k) => {
    headers[k] = v
  })
  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    body,
    url: res.url,
    headers
  }
}

chrome.runtime.onMessageExternal.addListener(
  (request, _sender, sendResponse) => {
    if (request.action === "ping") {
      sendResponse({ pong: true })
      return
    }

    if (request.action === RUN_FUNC) {
      const { fnPath, params = [] } = request as {
        fnPath: string
        params: unknown[]
      }

      if (fnPath === "customFetch") {
        const [url, opts] = params as [string, RequestInit?]
        bgFetch(url, opts)
          .then(sendResponse)
          .catch(() => sendResponse(null))
        return true
      }

      // Generic chrome.* function dispatcher
      if (fnPath.startsWith("chrome.")) {
        const parts = fnPath.split(".")
        let fn: unknown = chrome
        for (const part of parts.slice(1))
          fn = (fn as Record<string, unknown>)?.[part]
        if (typeof fn === "function") {
          try {
            const result = (fn as Function)(...(params as unknown[]))
            if (
              result &&
              typeof (result as Promise<unknown>).then === "function"
            ) {
              ;(result as Promise<unknown>)
                .then(sendResponse)
                .catch(() => sendResponse(null))
            } else {
              sendResponse(result)
            }
          } catch {
            sendResponse(null)
          }
          return true
        }
      }

      sendResponse(null)
      return true
    }

    if (request.action === "GET_FB_USER_INFO") {
      facebookService
        .getFacebookAccountData()
        .then((data) => sendResponse({ success: true, data }))
        .catch(() =>
          sendResponse({
            success: false,
            data: {
              id: request.payload?.c_user ?? "",
              name: "Tài khoản cá nhân",
              avatar: request.payload?.c_user
                ? `https://graph.facebook.com/${request.payload.c_user}/picture?type=normal`
                : ""
            }
          })
        )
      return true
    }

    if (request.action === "INBOX_UPLOAD_MEDIA") {
      const { url, filesBase64 } = (request.payload ?? {}) as {
        url: string
        filesBase64: { fieldName: string; name: string; type: string; data: string }[]
      }
      const doUpload = async () => {
        const formData = new FormData()
        for (const f of filesBase64) {
          const base64Data = f.data.includes(",") ? f.data.split(",")[1] : f.data
          const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
          const blob = new Blob([bytes], { type: f.type || "application/octet-stream" })
          formData.append(f.fieldName, blob, f.name)
        }
        const res = await fetch(url, { method: "POST", credentials: "include", body: formData })
        const body = await res.text()
        return { ok: res.ok, status: res.status, body }
      }
      doUpload()
        .then(sendResponse)
        .catch((e) => sendResponse({ ok: false, status: 0, body: "", error: e.message }))
      return true
    }
  }
)

// ─────────────────────────────────────────────────────────────────────────────

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage()
})

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1, 10, 11, 12, 13],
    addRules: rules as any
  })
  // Allow content scripts to access session storage
  try {
    if (
      chrome.storage &&
      chrome.storage.session &&
      (chrome.storage.session as any).setAccessLevel
    ) {
      await (chrome.storage.session as any).setAccessLevel({
        accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS"
      })
    }
  } catch (e) {
    console.error("Failed to set session storage access level:", e)
  }
  // Fresh install or reload of a new build: re-evaluate immediately so a stale
  // "update available" state clears and a required update is announced.
  await scheduleVersionCheckAlarm()
  runVersionCheck({ force: true })
})

chrome.runtime.onStartup.addListener(() => {
  scheduleVersionCheckAlarm()
  runVersionCheck()
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === VERSION_CHECK_ALARM) runVersionCheck({ force: true })
})

// Registered at top level: the worker may have been woken by this very click.
chrome.notifications.onClicked.addListener((notificationId) => {
  if (!isUpdateNotification(notificationId)) return
  chrome.notifications.clear(notificationId)
  openDownloadPage()
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // ==================== INBOX HANDLERS ====================
  if (message.action === "INBOX_GET_CONFIG") {
    const userId = message.payload?.c_user
    fetchBusinessInboxConfig(userId).then(sendResponse)
    return true
  }

  if (message.action === "INBOX_GET_PAGE_LIST") {
    const userId = message.payload?.c_user
    const tabId = sender.tab?.id ?? null

    const sendProgress = (count: number, isComplete: boolean) => {
      if (tabId) {
        chrome.tabs
          .sendMessage(tabId, {
            action: "INBOX_PAGE_LIST_PROGRESS",
            payload: { count, isComplete }
          })
          .catch(() => {})
      }
    }

    fetchBusinessInboxConfig(userId)
      .then((configResult) => {
        if (!configResult.success)
          return sendResponse({ success: false, error: configResult.error })
        return fetchPageListInbox([], null, sendProgress).then(sendResponse)
      })
      .catch((e) => sendResponse({ success: false, error: e.message }))
    return true
  }

  if (message.action === "INBOX_GET_THREADS") {
    const { page_id, before_call, limit } = message.payload ?? {}
    fetchUsersInboxBg(page_id, before_call ?? null, limit).then(sendResponse)
    return true
  }

  if (message.action === "GET_FB_USER_INFO") {
    facebookService
      .getFacebookAccountData()
      .then((data) => sendResponse({ success: true, data: data }))
      .catch(() =>
        sendResponse({
          success: false,
          data: {
            id: message.payload?.c_user,
            name: "Tài khoản cá nhân",
            avatar: `https://graph.facebook.com/${message.payload?.c_user}/picture?type=normal`
          }
        })
      )
    return true
  }

  if (message.action === "INBOX_GET_REQUEST_CONFIG") {
    // Reload the config if the service worker was restarted since the page list was fetched
    ensureInboxConfig()
      .then((ok) => sendResponse(ok ? { success: true, config: getInboxRequestConfig() } : { success: false }))
      .catch(() => sendResponse({ success: false }))
    return true
  }

  if (message.action === "INBOX_GET_C_USER") {
    chrome.cookies.get(
      { url: "https://www.facebook.com", name: "c_user" },
      (cookie) => {
        sendResponse({ value: cookie ? cookie.value : null })
      }
    )
    return true
  }

  if (message.action === "INBOX_FETCH_IMAGE_BASE64") {
    const url: string = message.url
    if (!url?.startsWith("http")) {
      sendResponse({ success: false, message: "Invalid URL" })
      return true
    }
    const tryUrls: string[] = [url]
    if (url.includes("scontent")) {
      const large = url
        .replace(/\/s\d+x\d+\//g, "/s200x200/")
        .replace(/\/p\d+x\d+\//g, "/p200x200/")
      if (large !== url) tryUrls.unshift(large)
    }
    const tryFetch = async () => {
      for (const u of tryUrls) {
        try {
          const res = await fetch(u, { redirect: "follow" })
          if (!res.ok) continue
          const ct = res.headers.get("Content-Type") ?? ""
          if (!ct.includes("image")) continue
          const blob = await res.blob()
          if (blob.size < 100) continue
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
          return { success: true, base64, size: blob.size }
        } catch {
          continue
        }
      }
      return { success: false, message: "All URLs failed" }
    }
    tryFetch().then(sendResponse)
    return true
  }

  if (message.action === "FB_DTSG") {
    const profileUrl = `https://www.facebook.com/profile.php?id=${message.c_user}`
    fetch(profileUrl)
      .then((response) => response.text())
      .then((pageContent) => {
        const regexPattern = /DTSGInitialData(.?)+IntlPhonologicalRules/gm
        const match = pageContent.match(regexPattern)
        const token = match && match.length > 0 ? match[0].split('"')[4] : null
        sendResponse(token)
      })
      .catch((err) => {
        console.error("Có lỗi xảy ra:", err)
        sendResponse(null)
      })
      .finally(() => {
        // đảm bảo kết thúc
        return true
      })

    return true // giữ kênh mở
  }

  if (message.type === ERemoteMessageType.GET_COOKIES) {
    chrome.cookies.getAll({ domain: message.domain }, (cookies) => {
      if (cookies && cookies.length > 0) {
        const cookieList = cookies
          .map((cookie) => `${cookie.name}=${cookie.value}`)
          .join(";")
        sendResponse(cookieList)
      } else {
        sendResponse(null)
      }
    })
    return true
  }

  if (message.type === ERemoteMessageType.GET_COOKIE) {
    chrome.cookies.get({ url: message.url, name: message.name }, (cookie) => {
      if (cookie) {
        sendResponse(decodeURIComponent(cookie.value))
      } else {
        sendResponse(null)
      }
    })
    return true
  }

  if (message.type === ERemoteMessageType.SET_COOKIE) {
    if (message.details) {
      chrome.cookies.set(message.details, (cookie) => {
        sendResponse(cookie)
      })
    } else {
      const expirationDate =
        Math.floor(Date.now() / 1000) +
        (message.expirationDays || 30) * 24 * 60 * 60
      chrome.cookies.set(
        {
          url: message.url,
          name: message.name,
          value: encodeURIComponent(message.value),
          expirationDate: expirationDate,
          secure: true,
          sameSite: "lax"
        },
        (cookie) => {
          sendResponse(cookie)
        }
      )
    }
    return true
  }

  if (message.type === ERemoteMessageType.REMOVE_COOKIE) {
    chrome.cookies.remove(
      { url: message.url, name: message.name },
      (details) => {
        sendResponse(details)
      }
    )
    return true
  }

  if (message.type === ERemoteMessageType.DOWNLOAD_FILE) {
    downloadFileWithChromeApi({ ...message.options, ...message.config })
      .then((result) => sendResponse({ success: true, result }))
      .catch((error: Error) =>
        sendResponse({ error: error?.message || "Download failed" })
      )
    return true
  }

  if (message.type === ERemoteMessageType.DOWNLOAD_FORBIDDEN_MEDIA) {
    downloadForbiddenMediaWithChromeApi(
      message.mediaUrl,
      message.filename,
      message.config ?? {}
    )
      .then((result) => sendResponse({ success: true, result }))
      .catch((error: Error) =>
        sendResponse({ error: error?.message || "Download failed" })
      )
    return true
  }

  if (message.type === ERemoteMessageType.TABS_CREATE) {
    chrome.tabs.create(message.options, (tab) => {
      sendResponse(tab)
    })
    return true
  }

  if (message.type === ERemoteMessageType.TABS_QUERY) {
    chrome.tabs.query(message.queryInfo, (tabs) => {
      sendResponse(tabs)
    })
    return true
  }

  if (message.type === ERemoteMessageType.TABS_REMOVE) {
    chrome.tabs.remove(message.tabId, () => {
      sendResponse(true)
    })
    return true
  }

  if (message.type === ERemoteMessageType.GET_COOKIES_LIST) {
    const filter: chrome.cookies.GetAllDetails = {}
    if (message.url) {
      filter.url = message.url
    } else if (message.domain) {
      filter.domain = message.domain
    }

    chrome.cookies.getAll(filter, (cookies) => {
      sendResponse(cookies || [])
    })
    return true
  }

  if (message.type === ERemoteMessageType.FETCH_BINARY) {
    // Binary-safe fetch for the ZIP downloader: body comes back as a data URL
    bgFetch(message.url, { credentials: "include" })
      .then((result) => sendResponse(result))
      .catch((error: Error) => sendResponse({ ok: false, error: error.message }))
    return true
  }

  if (message.type === ERemoteMessageType.BACKGROUND_FETCH) {
    const { url, options } = message
    fetch(url, {
      ...options,
      credentials: "include" // Đảm bảo gửi kèm cookies của trình duyệt
    })
      .then(async (response) => {
        const text = await response.text()
        sendResponse({
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          data: text
        })
      })
      .catch((error) => {
        sendResponse({ error: error.message })
      })
    return true
  }

  if (message.type === ERemoteMessageType.SET_STORAGE) {
    chrome.storage.local.set({ [message.key]: message.value }, () => {
      sendResponse(true)
    })
    return true
  }

  if (message.type === ERemoteMessageType.GET_STORAGE) {
    chrome.storage.local.get([message.key], (result) => {
      const item = result[message.key]
      if (
        item &&
        typeof item === "object" &&
        "__expireAt" in item &&
        "__value" in item
      ) {
        if (Date.now() > item.__expireAt) {
          chrome.storage.local.remove(message.key)
          sendResponse(null)
        } else {
          sendResponse(item.__value)
        }
      } else {
        sendResponse(item ?? null)
      }
    })
    return true
  }

  if (message.type === ERemoteMessageType.REMOVE_STORAGE) {
    chrome.storage.local.remove([message.key], () => {
      sendResponse(true)
    })
    return true
  }

  if (message.type === ERemoteMessageType.VERSION_CHECK) {
    runVersionCheck({ force: !!message.force })
      .then(sendResponse)
      .catch(() => sendResponse(null))
    return true
  }
})

// Worker (re)start: cheap because a fresh cached result is reused.
scheduleVersionCheckAlarm()
runVersionCheck()
