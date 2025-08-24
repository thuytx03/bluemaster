import { ERemoteMessageType } from "src/constants/enum"
import { checkExtensionVersion } from "./utils/common.util"
import { captureRequestsZalo } from "./utils/zalo.util";

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage()
})

let xHeadersData: any = null


let zaloIMEI: string | null = null;
let zaloCookies: any[] | null = null;
let zaloUserAgent: string | null = null;
let pendingZaloResponse: ((data: any) => void) | null = null;
let pendingZaloTimeout: ReturnType<typeof setTimeout> | null = null;

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

captureRequestsZalo({
  onIMEI: (imei) => {
    console.log('[ZALO] IMEI captured:', imei);
    zaloIMEI = imei;
    maybeSendZaloInfo();
  },
  onCookies: (cookies) => {
    console.log('[ZALO] Cookies captured:', cookies);
    zaloCookies = cookies;
    maybeSendZaloInfo();
  },
  onUserAgent: (ua) => {
    console.log('[ZALO] UserAgent captured:', ua);
    zaloUserAgent = ua;
    maybeSendZaloInfo();
  }
});

function maybeSendZaloInfo() {
  if (pendingZaloResponse && zaloIMEI && zaloCookies && zaloUserAgent) {
    pendingZaloResponse({ imei: zaloIMEI, cookies: zaloCookies, userAgent: zaloUserAgent });
    pendingZaloResponse = null;
    if (pendingZaloTimeout) {
      clearTimeout(pendingZaloTimeout);
      pendingZaloTimeout = null;
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GET_ZALO_INFO") {
    console.log('[ZALO] Requesting Zalo info');
    if (zaloIMEI && zaloCookies && zaloUserAgent) {
      sendResponse({ imei: zaloIMEI, cookies: zaloCookies, userAgent: zaloUserAgent });
    } else {
      // Chưa có data, lưu callback lại, sẽ trả về khi đủ data hoặc timeout
      pendingZaloResponse = sendResponse;
      pendingZaloTimeout = setTimeout(() => {
        if (pendingZaloResponse) {
          pendingZaloResponse({ imei: null, cookies: null, userAgent: null });
          pendingZaloResponse = null;
        }
      }, 60000); // 1 phút
    }
    // Giữ kênh mở cho callback bất đồng bộ
    return true;
  }
});

checkExtensionVersion()
