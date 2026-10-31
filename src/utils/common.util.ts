import axios from "axios"
import clsx, { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ERemoteMessageType, ESocialProvider, EStorageKey } from "src/constants/enum"
import useAuthStore from "src/stores/auth.store"
import { chromeUtils } from "src/utils/chrome.util"
import { EXTENSION_INFO } from "src/constants"

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

export const checkExtensionVersion = async () => {
  const notificationId = "update-notification"
  const { version: currentVersion } = chrome.runtime.getManifest()
  const { data } = await axios.get(
    "https://raw.githubusercontent.com/thuytx03/bluemaster/main/package.json"
  )
  const latestVersion = data.version
  const notifyLatestExtensionVersion = await chromeUtils.getStorage(
    EStorageKey.NOTIFY_LATEST_EXTENSION_VERSION
  )
  if (notifyLatestExtensionVersion === latestVersion) {
    return
  }
  if (currentVersion !== latestVersion) {
    await chromeUtils.setStorage(
      EStorageKey.NOTIFY_LATEST_EXTENSION_VERSION,
      latestVersion
    )
    chrome.notifications.create(notificationId, {
      type: "basic",
      iconUrl: "https://raw.githubusercontent.com/thuytx03/bluemaster/main/assets/icon.png",
      title: `🎉 ${EXTENSION_INFO.displayName} đã có phiên bản mới!`,
      message: `Vui lòng cập nhật để tận hưởng các tính năng và cải tiến mới nhất.`
    })
    await chromeUtils.setStorage(
      EStorageKey.NOTIFY_LATEST_EXTENSION_VERSION,
      latestVersion
    )
  }
  chrome.notifications.onClicked.addListener((clickedId) => {
    if (clickedId === notificationId) {
      chrome.tabs.create({
        url: "https://github.com/thuytx03/bluemaster/"
      })
    }
  })
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
