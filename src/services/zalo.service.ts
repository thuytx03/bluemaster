

interface ZaloCaptureCallbacks {
	onIMEI: (imei: string) => void;
	onCookies: (cookies: any[]) => void;
	onUserAgent: (ua: string) => void;
}

export function captureRequestsZalo(callbacks: ZaloCaptureCallbacks) {
	chrome.webRequest.onBeforeRequest.addListener(function (details) {
		const url = details.url;
		// Chỉ xử lý khi có request chứa imei
		if (url.includes("/api/login/getServerInfo") && url.indexOf("imei=") > -1) {
			const params = new URLSearchParams(new URL(url).search);
			const imeiValue = String(params.get("imei"));
			callbacks.onIMEI(imeiValue);
			// Chỉ gửi message khi có imei thực sự
			chrome.runtime.sendMessage({ action: "IMEIValue", imei: imeiValue });

			// Lấy cookies khi đã có imei và url là chat.zalo.me
			if (url.includes("chat.zalo.me")) {
				chrome.cookies.getAll({ url: url }, function (cookies) {
					const parsedCookies = cookies.map(cookie => ({
						domain: cookie.domain,
						expirationDate: cookie.expirationDate || null,
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
					callbacks.onCookies(parsedCookies);
					chrome.runtime.sendMessage({ action: "CookiesValue", cookies: JSON.stringify(parsedCookies) });

					// Chỉ gửi userAgent khi đã có imei và cookies
					const userAgent = navigator.userAgent;
					callbacks.onUserAgent(userAgent);
					chrome.runtime.sendMessage({ action: "UserAgent", useragent: userAgent });
				});
			}
		}
	},
		{ urls: ["<all_urls>"] },
		["requestBody"]
	);
}
