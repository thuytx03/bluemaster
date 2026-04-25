const getChromeCookies = async (domain: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    chrome.cookies.getAll({ domain }, function (cookies) {
      if (cookies.length > 0) {
        let cookieList = cookies
          .map((cookie) => `${cookie.name}=${cookie.value}`)
          .join(";")
        resolve(cookieList)
      } else {
        reject("Không tìm thấy cookie")
      }
    })
  })
}
export function setCookie(
  domain: string,
  name: string,
  value: string,
  expirationDays: number
) {
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
    (cookie) => {
      if (chrome.runtime.lastError) {
        console.error("Error setting cookie:", chrome.runtime.lastError)
      } else {
        // console.log("Cookie set successfully:", cookie);
      }
    }
  )
}

export function getCookie(
  domain: string,
  name: string
): Promise<string | null> {
  return new Promise((resolve, reject) => {
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
  return new Promise((resolve, reject) => {
    chrome.cookies.remove(
      {
        url: domain,
        name: name
      },
      (cookie) => {
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
  const tab = await chrome.tabs.create(options)
  return tab
}

const closeTab = async (tabId: number): Promise<void> => {
  await chrome.tabs.remove(tabId)
}

const getStorage = async <T>(key: string): Promise<T | null> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, function (result) {
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
    chrome.storage.session.get(key, function (result) {
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
    chrome.storage.session.remove(key, function () {
      resolve()
    })
  })
}

const downloadFile = async (
  options: chrome.downloads.DownloadOptions,
  waitUntilCompleted: boolean = true
) => {
  return new Promise(async (resolve, reject) => {
    chrome.downloads.download(options, (downloadId) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError)
      }
      if (!waitUntilCompleted) {
        return resolve("Tải xuống bắt đầu")
      } else {
        chrome.downloads.onChanged.addListener(
          function onDownloadChanged(downloadDelta) {
            if (downloadDelta.id === downloadId && downloadDelta.state) {
              if (downloadDelta.state.current === "complete") {
                resolve("Tải xuống hoàn tất")
                chrome.downloads.onChanged.removeListener(onDownloadChanged)
              } else if (downloadDelta.state.current === "interrupted") {
                reject("Tải xuống bị gián đoạn")
                chrome.downloads.onChanged.removeListener(onDownloadChanged)
              }
            }
          }
        )
      }
    })
  })
}

export const chromeUtils = {
  setCookie,
  getCookie,
  removeCookie,
  getChromeCookies,
  getStorage,
  setStorage,
  removeStorage,
  setSessionStorage,
  getSessionStorage,
  removeSessionStorage,
  downloadFile,
  openNewTab,
  closeTab
}
