import { ERemoteMessageType } from "src/constants/enum"
import { chromeUtils } from "src/utils/chrome.util"
import { fetchDataXHR } from "src/utils/common.util"

export const fetchTokenEAAGNO = () => {
  return new Promise(function (resolve, reject) {
    fetchDataXHR({
      url: "https://business.facebook.com/content_management",
      method: "get"
    })
      .then(function (response) {
        response = response as string
        const responseStr = response as string
        if (
          responseStr.search("twofactor") !== -1 &&
          responseStr.search("EAA") === -1
        ) {
          chromeUtils.openNewTab({
            url: "https://business.facebook.com/content_management",
            active: false
          })
          return resolve("")
        }
        var match = responseStr.match(/EAAGNO.*?"/)
        var accessToken = match && match[0] ? match[0].replace(/\W/g, "") : ""
        // console.log('Đây là token từ trang business.facebook.com/content_management: ', accessToken);
        resolve(accessToken)
      })
      .catch(reject)
  })
}

export const fetchTokenEAAB = () => {
  return new Promise(function (resolve, reject) {
    fetchDataXHR({
      url: "https://adsmanager.facebook.com/adsmanager/manage/campaigns",
      method: "get"
    })
      .then(function (response) {
        const responseStr = response as string
        if (responseStr.search("EAA") !== -1) {
          const direct = responseStr.match(/EAAB.*?"/)
          return resolve(direct?.[0] ? direct[0].replace(/\W/g, "") : "")
        }
        let redirectUrl: string | undefined
        const regex = /window\.location\.replace\("(.*?)"\)/g
        let redirectMatch: RegExpExecArray | null
        while ((redirectMatch = regex.exec(responseStr)) !== null) {
          if (redirectMatch.index === regex.lastIndex) {
            regex.lastIndex++
          }
          if (redirectMatch[1]) redirectUrl = decodeURIComponent(redirectMatch[1])
        }
        if (redirectUrl) {
          fetchDataXHR({
            url: redirectUrl,
            method: "get"
          })
            .then(function (redirectResponse) {
              const redirectResponseStr = redirectResponse as string
              if (redirectResponseStr.search("EAA") === -1) {
                return resolve("")
              }
              const redirected = redirectResponseStr.match(/EAAB.*?"/)
              resolve(redirected?.[0] ? redirected[0].replace(/\W/g, "") : "")
              // console.log('Đây là token từ trang adsmanager.facebook.com/adsmanager/manage/campaigns: ', token);
            })
            .catch(reject)
        } else {
          resolve("")
        }
      })
      .catch(reject)
  })
}

interface IExtractUIDResult {
  status: number
  data: string | any
}

export const getUserID = async (url: string): Promise<IExtractUIDResult> => {
  // Regex kiểm tra URL
  const regex =
    /(?:https?:\/\/)?(?:www|m\.)?(?:facebook|fb|m|.me\.facebook)\.(?:com|me|watch)\/(?:(?:\w)*#!\/)?(?:pages\/)?(?:[\w-]*\/)*([\w\-.]+)(?:\/)?/i
  const match = url.match(regex)

  if (!match) {
    return {
      status: 400,
      data: "URL không hợp lệ"
    }
  }

  let matchedValue = match[1]

  // Xử lý nếu URL chứa `/posts/`
  if (url.includes("/posts/")) {
    const prefix = "https://www.facebook.com/"
    if (url.startsWith(prefix)) {
      matchedValue = url.substring(prefix.length)
      console.log("match[1]=====", url.substring(prefix.length))
    }
  }

  // Xử lý profile.php
  if (matchedValue === "profile.php") {
    const urlSearch = new URL(url)
    const uId = urlSearch.searchParams.get("id")
    return {
      status: 200,
      data: uId
    }
  }
  const cacheKey = `uid_cache_${matchedValue}`
  const cachedDataSession = await chromeUtils.getSessionStorage(cacheKey)
  if (cachedDataSession) {
    return {
      status: 200,
      data: cachedDataSession
    }
  }

  // Nếu URL hợp lệ và chưa có trong cache thì gọi API
  const newUrl = `https://facebook.com/${matchedValue}`

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: ERemoteMessageType.GET_USER_ID, link: newUrl },
      (result) => {
        if (chrome.runtime.lastError) {
          resolve({ status: 500, data: "Đã xảy ra lỗi khi gọi API" })
        } else {
          // Nếu gọi API ra kết quả 200 thành công thì lưu dữ liệu lại vào Storage Local
          if (result && result.status === 200 && result.data) {
            chromeUtils.setSessionStorage(cacheKey, result.data)
            console.log(`💾 [Cache Set] Lưu UID mới cho ${matchedValue}: `, result.data)
          }
          resolve(result)
        }
      }
    )
  })
}
