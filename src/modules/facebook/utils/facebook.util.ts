import facebookService from "src/modules/facebook/services/facebook.service"
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

/**
 * Resolve a Facebook profile/page/group URL (or bare username) to its numeric id
 * using the logged-in session: the profile page HTML carries the id, so no
 * third-party lookup service is needed.
 */
export const getUserID = async (url: string): Promise<IExtractUIDResult> => {
  const regex =
    /(?:https?:\/\/)?(?:www|m\.)?(?:facebook|fb|m|.me\.facebook)\.(?:com|me|watch)\/(?:(?:\w)*#!\/)?(?:pages\/)?(?:[\w-]*\/)*([\w\-.]+)(?:\/)?/i
  const match = url.match(regex)
  if (!match) {
    return { status: 400, data: "URL không hợp lệ" }
  }

  // profile.php?id=123 already contains the id
  if (match[1] === "profile.php") {
    const id = new URL(url.startsWith("http") ? url : `https://${url}`).searchParams.get("id")
    return id ? { status: 200, data: id } : { status: 400, data: "URL không hợp lệ" }
  }

  // group URLs: resolve the group id
  const groupSlug = url.match(/facebook\.com\/groups\/([A-Za-z0-9._-]+)/i)?.[1]
  const identifier = groupSlug ?? match[1]
  const cacheKey = `uid_cache_${groupSlug ? "group_" : ""}${identifier}`
  const cached = await chromeUtils.getSessionStorage(cacheKey)
  if (cached) {
    return { status: 200, data: cached }
  }

  try {
    const id = groupSlug
      ? await facebookService.getGroupIdFromName(groupSlug)
      : (await facebookService.getProfileInfo(identifier)).id
    await chromeUtils.setSessionStorage(cacheKey, id)
    return { status: 200, data: id }
  } catch (error) {
    return { status: 404, data: (error as Error).message || "Không tìm thấy UID" }
  }
}
