import { ERemoteMessageType } from "src/constants/enum"

import { captureRequestsZalo } from "./modules/zalo/services/zalo.service"
import { checkExtensionVersion } from "./utils/common.util"

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage()
})

let xHeadersData: any = null

let zaloIMEI: string | null = null
let zaloCookies: any[] | null = null
let zaloUserAgent: string | null = null
let pendingZaloResponse: ((data: any) => void) | null = null
let pendingZaloTimeout: ReturnType<typeof setTimeout> | null = null

chrome.runtime.onInstalled.addListener(async () => {
  const rules = [
    {
      id: 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          {
            header: "Origin",
            operation: "remove"
          }
        ]
      },
      condition: {
        urlFilter: "https://www.facebook.com/api/graphql/*",
        resourceTypes: ["xmlhttprequest"]
      }
    }
  ]

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1],
    addRules: rules as any
  })

  console.log(
    "Rule to remove Origin header for Facebook GraphQL API has been applied."
  )

  // Allow content scripts to access session storage
  try {
    if (chrome.storage && chrome.storage.session && (chrome.storage.session as any).setAccessLevel) {
      await (chrome.storage.session as any).setAccessLevel({
        accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS"
      })
    }
  } catch (e) {
    console.error("Failed to set session storage access level:", e)
  }
})

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const headers = details.requestHeaders || []
    const authorization =
      headers.find((h) => h.name.toLowerCase() === "authorization")?.value || ""
    const xCsrfToken =
      headers.find((h) => h.name.toLowerCase() === "x-csrf-token")?.value || ""

    // Lưu header mới nhất
    if (authorization && xCsrfToken) {
      xHeadersData = {
        authorization,
        xCsrfToken
      }
    }
  },
  { urls: ["*://x.com/i/api/graphql/*"] },
  ["requestHeaders", "extraHeaders"]
)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === ERemoteMessageType.RETRIEVE_X_ACCOUNT_CREDENTIALS) {
    sendResponse(xHeadersData)
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

  if (message.type === ERemoteMessageType.GET_USER_ID) {
    const data = new URLSearchParams({ link: message.link }).toString()
    fetch("https://id.traodoisub.com/api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: data,
    })
      .then(res => res.json())
      .then(json => {
        if (json.error) {
          sendResponse({ status: 400, data: json.error })
        } else {
          sendResponse({ status: 200, data: json })
        }
      })
      .catch(() => {
        sendResponse({ status: 500, data: "Đã xảy ra lỗi khi gọi API" })
      })
    return true // giữ kênh mở cho async
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
      const expirationDate = Math.floor(Date.now() / 1000) + (message.expirationDays || 30) * 24 * 60 * 60
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
    chrome.cookies.remove({ url: message.url, name: message.name }, (details) => {
      sendResponse(details)
    })
    return true
  }

  if (message.type === ERemoteMessageType.DOWNLOAD_FILE) {
    chrome.downloads.download(message.options, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message })
      } else {
        sendResponse({ downloadId })
      }
    })
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

  if(message.type === ERemoteMessageType.SET_STORAGE){
    chrome.storage.local.set({ [message.key]: message.value }, () => {
      sendResponse(true)
    })
    return true
  }

  if(message.type === ERemoteMessageType.GET_STORAGE){
    chrome.storage.local.get([message.key], (result) => {
      const item = result[message.key]
      if (item && typeof item === "object" && "__expireAt" in item && "__value" in item) {
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

  if(message.type === ERemoteMessageType.REMOVE_STORAGE){
    chrome.storage.local.remove([message.key], () => {
      sendResponse(true)
    })
    return true
  }
})

captureRequestsZalo({
  onIMEI: (imei) => {
    zaloIMEI = imei
    maybeSendZaloInfo()
  },
  onCookies: (cookies) => {
    zaloCookies = cookies
    maybeSendZaloInfo()
  },
  onUserAgent: (ua) => {
    zaloUserAgent = ua
    maybeSendZaloInfo()
  }
})

function maybeSendZaloInfo() {
  if (pendingZaloResponse && zaloIMEI && zaloCookies && zaloUserAgent) {
    pendingZaloResponse({
      imei: zaloIMEI,
      cookies: zaloCookies,
      userAgent: zaloUserAgent
    })
    pendingZaloResponse = null
    if (pendingZaloTimeout) {
      clearTimeout(pendingZaloTimeout)
      pendingZaloTimeout = null
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GET_ZALO_INFO") {
    if (zaloIMEI && zaloCookies && zaloUserAgent) {
      sendResponse({
        imei: zaloIMEI,
        cookies: zaloCookies,
        userAgent: zaloUserAgent
      })
    } else {
      // Chưa có data, lưu callback lại, sẽ trả về khi đủ data hoặc timeout
      pendingZaloResponse = sendResponse
      pendingZaloTimeout = setTimeout(() => {
        if (pendingZaloResponse) {
          pendingZaloResponse({ imei: null, cookies: null, userAgent: null })
          pendingZaloResponse = null
        }
      }, 60000) // 1 phút
    }
    // Giữ kênh mở cho callback bất đồng bộ
    return true
  }
})

checkExtensionVersion()
