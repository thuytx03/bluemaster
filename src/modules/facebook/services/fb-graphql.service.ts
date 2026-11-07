/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "sonner"

import { RUN_FUNC } from "src/constants"
import { ESocialProvider } from "src/constants/enum"
import { wrapGraphQlParams } from "src/modules/auto-run/utils/fb.util"
import useAuthStore from "src/stores/auth.store"
import { delay } from "src/utils/common.util"

export { deepFind } from "src/modules/auto-run/utils/dom.util"

export { delay }

/**
 * Facebook request layer for the tools ported from xthuy-social.
 *
 * The session (uid + fb_dtsg) comes from Bluemaster's existing `useAuthStore`
 * (the same verified account the downloader uses), and requests go straight
 * from the sidebar: it is a content script on www.facebook.com, so a
 * same-origin `fetch` already carries the user's cookies — no service-worker
 * round trip is needed.
 */

export interface CustomFetchResult {
  ok: boolean
  status: number
  statusText?: string
  body: string
  headers?: Record<string, string>
}

export interface FbFetchResult {
  ok: boolean
  data?: CustomFetchResult
  error?: string
}

export const CACHE_TIME = {
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000
}

const getAccount = () =>
  useAuthStore.getState().accounts[ESocialProvider.FACEBOOK]
export const getMyUid = (): string => getAccount()?.id ?? ""
export const getFbDtsg = (): string => getAccount()?.fbDtsg ?? ""

export type FbFetchInit = RequestInit & {
  /** Act as this Page: the service worker swaps the `i_user` cookie for the request */
  iUser?: string
}

/** Sends a message to the service worker; never throws. */
export function sendBgAction<T = any>(
  action: string,
  payload?: Record<string, unknown>
): Promise<{ ok: boolean; data?: T; error?: string }> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ action, payload }, (response) => {
        if (chrome.runtime.lastError)
          return resolve({ ok: false, error: chrome.runtime.lastError.message })
        resolve({ ok: true, data: response as T })
      })
    } catch (e) {
      resolve({
        ok: false,
        error: e instanceof Error ? e.message : "Extension error"
      })
    }
  })
}

const isSameOrigin = (url: string) => {
  try {
    return new URL(url).origin === location.origin
  } catch {
    return false
  }
}

/**
 * Credentialed request to Facebook. Same-origin calls go straight from the
 * sidebar (it runs on www.facebook.com); other hosts and Page-identity calls
 * (`iUser`) are relayed through the service worker. Never throws.
 */
export async function fbFetch(
  url: string,
  init: FbFetchInit = {}
): Promise<FbFetchResult> {
  const { iUser, ...rest } = init
  if (iUser || !isSameOrigin(url)) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: RUN_FUNC,
          fnPath: "customFetch",
          params: [
            url,
            { credentials: "include", ...rest, ...(iUser ? { iUser } : {}) }
          ]
        },
        (response) => {
          if (chrome.runtime.lastError || !response) {
            return resolve({
              ok: false,
              error: chrome.runtime.lastError?.message ?? "Relay failed"
            })
          }
          resolve({ ok: true, data: response as CustomFetchResult })
        }
      )
    })
  }
  try {
    const res = await fetch(url, { credentials: "include", ...rest })
    const headers: Record<string, string> = {}
    res.headers.forEach((v, k) => (headers[k] = v))
    return {
      ok: true,
      data: {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        body: await res.text(),
        headers
      }
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Network error"
    }
  }
}

export interface FbSessionTokens {
  uid: string
  fbDtsg: string
  /** `LSD` token, sent as `lsd` / `x-fb-lsd` by mutations that need it */
  lsd: string
  /** `SiteData` (`__rev`, `__hsi`, `__spin_*` …) used by comet mutations */
  siteData: Record<string, any>
}

let sessionCache: { at: number; uid: string; tokens: FbSessionTokens } | null =
  null
const SESSION_TTL = 30 * 60 * 1000

/**
 * uid + fb_dtsg from the verified account, plus `lsd` and `SiteData` scraped
 * from a lightweight facebook.com page (cached 30 min per account).
 */
export async function getSessionTokens(
  force = false
): Promise<FbSessionTokens> {
  const uid = getMyUid()
  if (
    !force &&
    sessionCache &&
    sessionCache.uid === uid &&
    Date.now() - sessionCache.at < SESSION_TTL
  ) {
    return sessionCache.tokens
  }
  const res = await fbFetch("https://www.facebook.com/policies_center/")
  const html = res.data?.body ?? ""
  const lsd =
    html.match(
      /\["LSD"\s*,\s*\[\]\s*,\s*\{[\s\S]*?"token"\s*:\s*"([^"]+)"/
    )?.[1] ?? ""
  const freshDtsg =
    html.match(/DTSGInitData",\[\],\{"token":"(.*?)"/)?.[1] ||
    html.match(
      /\["DTSGInitialData"\s*,\s*\[\]\s*,\s*\{[\s\S]*?"token"\s*:\s*"([^"]+)"/
    )?.[1]
  const siteData = parseSafe(
    html.match(/\["SiteData"\s*,\s*\[\]\s*,\s*(\{[\s\S]*?\})/)?.[1],
    {}
  )
  const tokens: FbSessionTokens = {
    uid,
    fbDtsg: freshDtsg || getFbDtsg(),
    lsd,
    siteData
  }
  sessionCache = { at: Date.now(), uid, tokens }
  return tokens
}

/** Parses Facebook JSON, stripping the `for (;;);` guard; `isNewLineJson` handles NDJSON (streamed GraphQL). */
export function parseSafe(
  str: any = "",
  fallbackValue: any = {},
  isNewLineJson = false
): any {
  try {
    if (str == null) return fallbackValue
    if (typeof str === "object") return str
    str = str.replaceAll("for (;;);", "")
    if (isNewLineJson && str.includes("\n") && !str.startsWith("[")) {
      try {
        return JSON.parse("[" + str.split("\n").join(",") + "]")
      } catch {
        /* fall through to plain parse */
      }
    }
    return JSON.parse(str)
  } catch {
    return fallbackValue
  }
}

let requestCounter = 1
let error429Count = 0

/** Surfaces rate-limit / critical GraphQL errors as toasts. Returns true when the request should be retried (429). */
function checkErrorResponse(
  response: CustomFetchResult | undefined,
  t?: (key: string) => string
): boolean {
  if (response?.status === 429) {
    error429Count++
    // one sticky toast (fixed id) instead of a new one per attempt
    toast.error(
      `${error429Count} - 🔒 ${t ? t("shared_error_429_title") : "Facebook returned Error 429: Too many requests"}`,
      {
        id: "fb-429",
        description: t
          ? t("shared_error_429_description")
          : "Increase the wait time, reduce concurrency or change your IP, then try again.",
        duration: Infinity
      }
    )
    return true
  }
  const parsed = parseSafe(response?.body, {}, true)
  const critical =
    (Array.isArray(parsed) ? parsed[0] : parsed)?.errors?.find(
      (e: any) => e.severity === "CRITICAL"
    ) || parsed?.error
  if (critical) {
    const summary = critical.summary || parsed?.errorSummary || ""
    const description =
      critical.description || parsed?.errorDescription || critical.message || ""
    if (summary || description) {
      toast.error("Facebook response Error", {
        id: `fb-error-${summary}`,
        description: [summary, critical.debug_info, description]
          .filter(Boolean)
          .join(". "),
        duration: Infinity
      })
    }
  }
  return false
}

/**
 * POSTs to Facebook GraphQL with the standard comet params (`__a`, `__comet_req`,
 * `__user`, `fb_dtsg`, …) merged in. Retries up to 5 times on HTTP 429 with exponential backoff.
 * Returns `{ ok, data: { status, body, … } }` so callers read `res?.data?.body`.
 */
export async function fetchGraphQl(
  params: any = {},
  options: any = {}
): Promise<FbFetchResult | null> {
  const {
    url = "https://www.facebook.com/api/graphql/",
    autoAddParams = true,
    customParams = {},
    customHeaders = {},
    autoRetry = true,
    t
  } = options

  const dtsg = getFbDtsg()
  if (!dtsg) {
    toast.error("Missing fb_dtsg token", {
      description: "Please verify your Facebook account and try again"
    })
    return null
  }

  const headers: Record<string, string> = {}
  let body: string
  if (typeof params === "string") {
    body = "&q=" + encodeURIComponent(params) + "&fb_dtsg=" + dtsg
  } else {
    const friendlyName: string =
      params.fb_api_req_friendly_name ||
      customParams.fb_api_req_friendly_name ||
      ""
    if (friendlyName) headers["X-FB-Friendly-Name"] = friendlyName
    body = wrapGraphQlParams({
      ...(autoAddParams
        ? {
            dpr: 1,
            __a: 1,
            __aaid: 0,
            __ccg: "GOOD",
            __comet_req: 15,
            __user: getMyUid(),
            __req: (requestCounter++).toString(36),
            server_timestamps: true,
            fb_dtsg: dtsg
          }
        : {}),
      ...customParams,
      ...params
    })
  }

  for (let attempt = 0; ; attempt++) {
    const res = await fbFetch(url, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...headers,
        ...customHeaders
      }
    })
    const shouldRetry = checkErrorResponse(res.data, t)
    if (!shouldRetry || !autoRetry) return res
    if (attempt >= 5) return null
    // exponential backoff with jitter: ~5s, 10s, 20s, 40s, 80s
    const wait = 5000 * 2 ** attempt + Math.floor(Math.random() * 1000)
    toast.info(
      `Waiting ${Math.round(wait / 1000)}s to retry API... ${attempt + 1}/5`,
      { id: "fb-429-retry", duration: wait }
    )
    await delay(wait)
  }
}

const routeDefCache: Record<string, any> = {}

/** Resolves a facebook.com route (e.g. `/<uid>/following`) to its comet route definition. */
export async function getRouteDefinition(
  routeUrl: string,
  useCache = true
): Promise<any> {
  if (useCache && routeDefCache[routeUrl]) return routeDefCache[routeUrl]
  const res = await fetchGraphQl(
    {
      client_previous_actor_id: getMyUid(),
      route_url: routeUrl,
      routing_namespace: "fb_comet"
    },
    { url: "https://www.facebook.com/ajax/route-definition/" }
  )
  const response = parseSafe(res?.data?.body, [], true)
  if (useCache) routeDefCache[routeUrl] = response
  return response
}
