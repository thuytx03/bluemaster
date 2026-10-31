import { ERemoteMessageType } from "src/constants/enum"
import {
  downloadFileWithChromeApi,
  downloadForbiddenMediaWithChromeApi,
  IDownloadFileConfig
} from "src/utils/download-core.util"

const getChromeCookies = async (domain: string): Promise<string> => {
  if (!chrome.cookies) {
    return new Promise((resolve) => {
      // Nếu là URL thì gửi url, nếu không thì gửi domain
      const isUrl = /^https?:\/\//i.test(domain)
      const params = isUrl ? { url: domain } : { domain }
      chrome.runtime.sendMessage(
        { type: ERemoteMessageType.GET_COOKIES, ...params },
        (response) => {
          if (response) {
            resolve(response)
          } else {
            resolve("")
          }
        }
      )
    })
  }
  return new Promise((resolve) => {
    const isUrl = /^https?:\/\//i.test(domain)
    const filter = isUrl ? { url: domain } : { domain }
    chrome.cookies.getAll(filter, function (cookies) {
      if (cookies && cookies.length > 0) {
        let cookieList = cookies
          .map((cookie) => `${cookie.name}=${cookie.value}`)
          .join(";")
        resolve(cookieList)
      } else {
        resolve("")
      }
    })
  })
}

const getChromeCookiesList = async (domain: string): Promise<chrome.cookies.Cookie[]> => {
  if (!chrome.cookies) {
    return new Promise((resolve) => {
      const isUrl = /^https?:\/\//i.test(domain)
      const params = isUrl ? { url: domain } : { domain }
      chrome.runtime.sendMessage(
        { type: ERemoteMessageType.GET_COOKIES_LIST, ...params },
        (response) => {
          if (response) {
            resolve(response)
          } else {
            resolve([])
          }
        }
      )
    })
  }
  return new Promise((resolve) => {
    const isUrl = /^https?:\/\//i.test(domain)
    const filter = isUrl ? { url: domain } : { domain }
    chrome.cookies.getAll(filter, function (cookies) {
      resolve(cookies || [])
    })
  })
}
 function setCookie(
  domain: string,
  name: string,
  value: string,
  expirationDays: number
) {
  if (!chrome.cookies) {
    chrome.runtime.sendMessage({
      type: ERemoteMessageType.SET_COOKIE,
      url: domain,
      name,
      value,
      expirationDays
    })
    return
  }
  const expirationDate =
    Math.floor(Date.now() / 1000) + expirationDays * 24 * 60 * 60
  chrome.cookies.set(
    {
      url: domain, // Phải chỉ định URL
      name: name,
      value: encodeURIComponent(value), // Mã hóa giá trị cookie
      expirationDate: expirationDate,
      secure: true, // Nếu website sử dụng HTTPS
      sameSite: "lax" // Cấu hình SameSite (None, Lax, Strict)
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("Error setting cookie:", chrome.runtime.lastError)
      } else {
        // console.log("Cookie set successfully:", cookie);
      }
    }
  )
}

const setChromeCookie = async (details: chrome.cookies.SetDetails): Promise<chrome.cookies.Cookie | null> => {
  if (!chrome.cookies) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: ERemoteMessageType.SET_COOKIE, details },
        (response) => {
          resolve(response || null)
        }
      )
    })
  }
  return new Promise((resolve) => {
    chrome.cookies.set(details, (cookie) => {
      resolve(cookie || null)
    })
  })
}

 function getCookie(
  domain: string,
  name: string
): Promise<string | null> {
  if (!chrome.cookies) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: ERemoteMessageType.GET_COOKIE, url: domain, name },
        (response) => {
          resolve(response || null)
        }
      )
    })
  }
  return new Promise((resolve) => {
    chrome.cookies.get(
      {
        url: domain, // URL cần truy cập để lấy cookie
        name: name // Tên cookie
      },
      (cookie) => {
        if (chrome.runtime.lastError) {
          console.error("Error getting cookie:", chrome.runtime.lastError)
          resolve(null)
        } else if (cookie) {
          const decodedValue = decodeURIComponent(cookie.value)
          resolve(decodedValue)
        } else {
          resolve(null)
        }
      }
    )
  })
}
const removeCookie = async (domain: string, name: string) => {
  if (!chrome.cookies) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: ERemoteMessageType.REMOVE_COOKIE, url: domain, name },
        (response) => {
          resolve(!!response)
        }
      )
    })
  }
  return new Promise((resolve) => {
    chrome.cookies.remove(
      {
        url: domain,
        name: name
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Error removing cookie:", chrome.runtime.lastError)
          resolve(false)
        } else {
          resolve(true)
        }
      }
    )
  })
}
const openNewTab = async (options: chrome.tabs.CreateProperties) => {
  if (!chrome.tabs) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: ERemoteMessageType.TABS_CREATE, options },
        (response) => {
          resolve(response)
        }
      )
    })
  }
  const tab = await chrome.tabs.create(options)
  return tab
}
const closeTab = async (tabId: number): Promise<void> => {
  if (!chrome.tabs) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: ERemoteMessageType.TABS_REMOVE, tabId },
        () => {
          resolve()
        }
      )
    })
  }
  await chrome.tabs.remove(tabId)
}

const queryTabs = async (queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> => {
  if (!chrome.tabs) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: ERemoteMessageType.TABS_QUERY, queryInfo },
        (response) => {
          resolve(response || [])
        }
      )
    })
  }
  return new Promise((resolve) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      resolve(tabs)
    })
  })
}

const getStorage = async <T>(key: string): Promise<T | null> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, function (result) {
      if (chrome.runtime.lastError) {
        console.error("Storage get error:", chrome.runtime.lastError)
        resolve(null)
        return
      }
      if (!result) {
        resolve(null)
        return
      }
      const item = result[key]
      if (
        item &&
        typeof item === "object" &&
        "__expireAt" in item &&
        "__value" in item
      ) {
        if (Date.now() > item.__expireAt) {
          chrome.storage.local.remove(key)
          resolve(null)
        } else {
          resolve(item.__value as T)
        }
      } else {
        resolve(item as T)
      }
    })
  })
}

const setStorage = async <T>(
  key: string,
  value: T,
  options?: { expireInDays?: number }
): Promise<void> => {
  return new Promise((resolve) => {
    let storageValue = value as any
    if (options?.expireInDays !== undefined) {
      storageValue = {
        __value: value,
        __createdAt: Date.now(),
        __expireAt: Date.now() + options.expireInDays * 24 * 60 * 60 * 1000
      }
    }
    chrome.storage.local.set({ [key]: storageValue }, function () {
      resolve()
    })
  })
}

const removeStorage = async (key: string): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, function () {
      resolve()
    })
  })
}

const setSessionStorage = async <T>(
  key: string,
  value: T,
  options?: { expireInDays?: number }
): Promise<void> => {
  return new Promise((resolve) => {
    if (!chrome.storage || !chrome.storage.session) {
      resolve()
      return
    }
    let storageValue = value as any
    if (options?.expireInDays !== undefined) {
      storageValue = {
        __value: value,
        __createdAt: Date.now(),
        __expireAt: Date.now() + options.expireInDays * 24 * 60 * 60 * 1000
      }
    }
    chrome.storage.session.set({ [key]: storageValue }, function () {
      resolve()
    })
  })
}

const getSessionStorage = async <T>(key: string): Promise<T | null> => {
  return new Promise((resolve) => {
    if (!chrome.storage || !chrome.storage.session) {
      resolve(null)
      return
    }
    chrome.storage.session.get(key, function (result) {
      if (chrome.runtime.lastError) {
        resolve(null)
        return
      }
      if (!result) {
        resolve(null)
        return
      }
      const item = result[key]
      if (
        item &&
        typeof item === "object" &&
        "__expireAt" in item &&
        "__value" in item
      ) {
        if (Date.now() > item.__expireAt) {
          chrome.storage.session.remove(key)
          resolve(null)
        } else {
          resolve(item.__value as T)
        }
      } else {
        resolve(item as T)
      }
    })
  })
}

const removeSessionStorage = async (key: string): Promise<void> => {
  return new Promise((resolve) => {
    if (!chrome.storage || !chrome.storage.session) {
      resolve()
      return
    }
    chrome.storage.session.remove(key, function () {
      resolve()
    })
  })
}

const normalizeDownloadConfig = (
  config?: boolean | IDownloadFileConfig
): IDownloadFileConfig =>
  typeof config === "boolean" ? { waitUntilCompleted: config } : (config ?? {})

/**
 * Download a file with retry/resume semantics (see download-core.ts).
 * Works from a content script (delegates to the background service worker)
 * as well as from extension pages that own the `downloads` API.
 *
 * `config` may be a boolean for backwards compatibility (= waitUntilCompleted).
 */
const downloadFile = async (
  options: chrome.downloads.DownloadOptions,
  config?: boolean | IDownloadFileConfig
): Promise<string> => {
  const downloadConfig = normalizeDownloadConfig(config)
  if (!chrome.downloads) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: ERemoteMessageType.DOWNLOAD_FILE, options, config: downloadConfig },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else if (!response || response.error) {
            reject(new Error(response?.error || "Download failed"))
          } else {
            resolve(response.result || "completed")
          }
        }
      )
    })
  }
  return downloadFileWithChromeApi({ ...options, ...downloadConfig })
}

/**
 * Fallback for media the browser cannot download directly (403 / CORS):
 * the background fetches it with cookies and saves it as a data URL.
 */
const downloadForbiddenMedia = async (
  mediaUrl: string,
  filename: string | undefined,
  config?: IDownloadFileConfig
): Promise<string> => {
  if (!chrome.downloads) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: ERemoteMessageType.DOWNLOAD_FORBIDDEN_MEDIA,
          mediaUrl,
          filename,
          config: config ?? {}
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else if (!response || response.error) {
            reject(new Error(response?.error || "Download failed"))
          } else {
            resolve(response.result || "completed")
          }
        }
      )
    })
  }
  return downloadForbiddenMediaWithChromeApi(mediaUrl, filename, config)
}

export const chromeUtils = {
  setCookie,
  getCookie,
  removeCookie,
  getChromeCookies,
  getChromeCookiesList,
  setChromeCookie,
  getStorage,
  setStorage,
  removeStorage,
  setSessionStorage,
  getSessionStorage,
  removeSessionStorage,
  downloadFile,
  downloadForbiddenMedia,
  openNewTab,
  closeTab,
  queryTabs
}
