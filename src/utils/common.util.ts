import clsx, { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ERemoteMessageType, ESocialProvider } from "src/constants/enum"
import useAuthStore from "src/stores/auth.store"

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isVerifyAccount = (socialName: ESocialProvider) => {
  const { accounts } = useAuthStore.getState()
  if (!accounts[socialName]) {
    return false
  }
  return true
}

export const fetchDataXHR = async (options: any) => {
  const { url, method, data, headers, responseType } = options

  // Nếu đang ở content script (sidebar) và có chrome.runtime, sử dụng background fetch để tránh CORS
  if (!chrome.cookies && chrome.runtime?.sendMessage) {
    try {
      const fetchOptions: any = {
        method: (method || "GET").toUpperCase(),
        headers
      }
      if (fetchOptions.method !== "GET" && data) {
        fetchOptions.body = data
      }
      const response = await chrome.runtime.sendMessage({ type: ERemoteMessageType.BACKGROUND_FETCH, url, options: fetchOptions })
      return response.data
    } catch (error) {
      console.error("Background Fetch Error:", error)
      throw error
    }
  }

  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest()
    xhr.onload = function () {
      resolve(xhr.response)
    }
    xhr.onerror = function () {
      reject(new Error("Network Error"))
    }
    xhr.open(method || "GET", url, true)
    if (headers) {
      Object.keys(headers).forEach(function (key) {
        xhr.setRequestHeader(key, headers[key])
      })
    }
    if (responseType) {
      xhr.responseType = responseType
    }
    xhr.send(data)
  })
}
