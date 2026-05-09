import { format } from "@fast-csv/format"
import axios from "axios"
import clsx, { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ESocialProvider, EStorageKey } from "src/constants/enum"
import useAuthStore from "src/store/auth"
import useDownloadProcesses from "src/modules/download/store/download-process"
import { chromeUtils } from "src/utils/chrome.util"
import { EXTENSION_INFO } from "src/constants"

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const downloadByBatch = async <T>(
  data: T[],
  downloadFunction: (item: T, index: number) => Promise<void>,
  batchSize: number = 1,
  onDownloadBatchCompleted?: (batchIndex: number) => void | Promise<void>
) => {
  for (let i = 0; i < data.length; i += batchSize) {
    const from = i
    const to = Math.min(i + batchSize, data.length)
    const sliceData = data.slice(from, to)
    await Promise.all(
      sliceData.map((item: any, index: number) =>
        downloadFunction(item, from + index + 1)
      )
    )
    if (onDownloadBatchCompleted) {
      await onDownloadBatchCompleted(to)
    }
  }
}

export const createCsvContentFromData = async <T extends object>(data: T[]) => {
  if (data.length === 0) return ""

  return new Promise<string>((resolve) => {
    const csvStream = format({ headers: true })
    let csvContent = ""

    csvStream
      .on("data", (chunk) => {
        csvContent += chunk.toString()
      })
      .on("end", () => {
        resolve(csvContent)
      })

    data.forEach((row) => csvStream.write(row))
    csvStream.end()
  })
}

export const downloadStatisticCsvFile = async <T extends object>(
  data: T[],
  filename: string
) => {
  const csvContent = await createCsvContentFromData(data)
  const blob = new Blob([csvContent], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  await chromeUtils.downloadFile({ url, filename })
  URL.revokeObjectURL(url)
}

export const extractIdFromUrl = (url: string, regexPattern: RegExp) => {
  const match = url.match(regexPattern)
  if (!match) {
    throw new Error("URL không hợp lệ")
  }
  return match[1]
}

export const isDownloadProcessExist = (
  socialName: ESocialProvider,
  processId: string
) => {
  const { getDownloadProcessBySocial } = useDownloadProcesses.getState()
  const downloadProcess = getDownloadProcessBySocial(socialName)
  const isProcessExist = downloadProcess.some(
    (process) => process.id === processId
  )
  return isProcessExist
}

export const isVerifyAccount = (socialName: ESocialProvider) => {
  const { accounts } = useAuthStore.getState()
  if (!accounts[socialName]) {
    return false
  }
  return true
}

export const makeRequestToFacebookFromContent = async (
  docID: string,
  query: any
) => {
  const { data: rawData } = await axios.get("https://www.facebook.com", {
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
    }
  })
  const profileRegex = /"story_bucket_owner":(.*?),"story_bucket_type":/
  const fbDtsgRegex = /"DTSGInitialData".*?"token":"(.*?)"/
  const originalProfileInfor = rawData.match(profileRegex)
  const fbDtsg = rawData.match(fbDtsgRegex)?.[1]
  if (!originalProfileInfor || !fbDtsg) {
    throw new Error("Không thể lấy thông tin người dùng")
  }
  const profileInfor = JSON.parse(originalProfileInfor[1])
  const profileId = profileInfor.id
  const formData = new FormData()
  formData.set("__a", "1")
  formData.set("__comet_req", "15")
  formData.set("fb_dtsg", fbDtsg)
  formData.set("av", profileId)
  formData.set("doc_id", docID)
  formData.set("variables", JSON.stringify(query))
  const { data: responseData } = await axios.post(
    "https://www.facebook.com/api/graphql",
    formData
  )
  return responseData
}

export const checkExtensionVersion = async () => {
  const notificationId = "update-notification"
  const { version: currentVersion } = chrome.runtime.getManifest()
  const { data } = await axios.get(
    "https://raw.githubusercontent.com/thuytx03/Xthuy-Social/main/package.json"
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
      iconUrl: "https://raw.githubusercontent.com/thuytx03/Xthuy-Social/main/assets/icon.png",
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
        url: "https://github.com/thuytx03/Xthuy-Social/"
      })
    }
  })
}

export function copyTextToClipboard(text: string): void {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      // console.log('Text copied to clipboard successfully!');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }
}
export const normalizeText = (text: string) => {
  return text
    .normalize("NFD") // Chuyển thành dạng ký tự cơ bản + dấu
    .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu
    .toLowerCase(); // Chuyển về chữ thường
};


export const removeCacheStorage = async () => {
  await chrome.storage.local.remove(['data']);
}
export const onStartExtension = async (data: any) => {
  chrome.storage.local.set({
    data: {
      ...data,
      active: true
    }
  });
}
export const copyToClipboard = (data: string) => {
  navigator.clipboard.writeText(data).then(() => {
    alert('Đã sao chép!');
  }).catch(err => {
    alert('Sao chép thất bại!');
  });
}
export const fetchDataXHR = (options: any) => {
  var url = options.url,
    method = options.method,
    data = options.data,
    headers = options.headers,
    responseType = options.responseType;

  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function () {
      reject(new Error("Network Error"));
    };
    xhr.open(method, url, true);
    if (headers) {
      Object.keys(headers).forEach(function (key) {
        xhr.setRequestHeader(key, headers[key]);
      });
    }
    if (responseType) {
      xhr.responseType = responseType;
    }
    xhr.send(data);
  });
}

/**
 * Hàm này dùng để lấy endpoint khi truyền vào
 * VD: getApiEndPoint(['api','v1','example']) => /api/v1/exmple
 * VD với endpoint có query: getApiEndPoint(['api','v1','example'], {page: 1}) => /api/v1/exmple/?page=1
 */
export function getApiEndpoint(path: string[], query?: Record<string, any>): string {
  const fullPath = path.join('/');
  if (query) {
    const queryString = new URLSearchParams(query).toString();
    return `/${fullPath}?${queryString}`;
  }
  return `/${fullPath}`;
}

export const removeTrailingUnderscoreZero = (members: string[]) => {
  return members.map(member => member.replace(/_0$/, ''))
}
// Hàm kiểm tra số điện thoại Việt Nam (hỗ trợ cả 0 và +84)
export const isValidVietnamPhone = (phone: string) => {
  // Chuẩn hóa về dạng 0xxxxxxxxx nếu là +84xxxxxxxxx
  let normalized = phone.replace(/^\+84/, '0')
  // Bắt đầu bằng 0, tiếp theo là 3|5|7|8|9, tổng 10 số
  return /^0[35789]\d{8}$/.test(normalized)
}