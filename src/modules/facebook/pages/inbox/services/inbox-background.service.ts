import {
  generateCquick,
  generateCsr,
  generateDyn,
  generateRequest,
  generateUsid
} from "src/modules/facebook/utils/payload.util"

// ==================== STATE ====================
let inboxRequestConfig: Record<string, any> = {}

// ==================== FETCH BUSINESS CONFIG ====================

export async function fetchBusinessInboxConfig(
  userId: string
): Promise<{ success: boolean; config?: Record<string, any>; error?: string }> {
  try {
    const response = await fetch(
      "https://business.facebook.com/latest/inbox/all",
      { credentials: "include" }
    )
    if (!response.ok) throw new Error("Network response was not ok")
    const html = await response.text()

    const dtsgMatch = html.match(/DTSGInitialData(.?)+IntlPhonologicalRules/gm)
    if (!dtsgMatch) throw new Error("fb_dtsg not found")
    const fbDtsg = dtsgMatch[0].split('"')[4]

    const cquickTokenMatch = html.match(/compat_iframe_token":"(.?)+",/gm)
    const cquickToken = cquickTokenMatch
      ? cquickTokenMatch[0].split('"')[2]
      : ""

    const spinDataStr =
      "{" + (html.match(/"hsi":"(.?)+__spin_t":\d+/gm)?.[0] ?? "") + "}"
    const spinData = JSON.parse(spinDataStr)

    const qmMatch = html.match(/\\\/ajax\\\/qm\\\/\?(.*?)"/)
    const qmParams = new URLSearchParams(qmMatch ? qmMatch[1] : "")
    const paramA = qmParams.get("__a") ?? "1"
    const cometReq = qmParams.get("__comet_req") ?? "7"
    const jazoest = qmParams.get("jazoest") ?? ""

    const siteData = JSON.parse(
      html.match(/\["SiteData",\[\],([^\]]+),\d+\]/)?.[1] ?? "{}"
    )
    const asyncParamsData = JSON.parse(
      html.match(/\["GetAsyncParamsExtraData",\[\],([^\]]+),\d+\]/)?.[1] ?? "{}"
    )
    const lsdData = JSON.parse(
      html.match(/\["LSD",\[\],([^\]]+),\d+\]/)?.[1] ?? "{}"
    )
    const connectionData = JSON.parse(
      html.match(
        /\["WebConnectionClassServerGuess",\[\],([^\]]+),\d+\]/
      )?.[1] ?? "{}"
    )

    inboxRequestConfig = {
      c_user: userId,
      bl_hash_version: siteData.bl_hash_version,
      comet_env: siteData.comet_env,
      compose_bootloads: siteData.compose_bootloads,
      cquick_token: cquickToken,
      cquick: generateCquick(),
      dpr: siteData.pr ?? 1,
      fb_dtsg: fbDtsg,
      jazoest,
      lsd: lsdData.token,
      usid: generateUsid(),
      semr_host_bucket: siteData.semr_host_bucket,
      spin: siteData.spin,
      wbloks_env: siteData.wbloks_env,
      __a: +paramA,
      __comet_req: +cometReq,
      __aaid: asyncParamsData?.extra_data?.__aaid,
      __ccg: connectionData.connectionClass,
      __csr: generateCsr(),
      __dyn: generateDyn(),
      __hs: siteData.haste_session,
      __hsi: siteData.hsi,
      __pc: siteData.pkg_cohort,
      __rev: siteData.server_revision,
      __spin_b: siteData.__spin_b,
      __spin_r: siteData.__spin_r,
      ...spinData
    }

    return { success: true, config: inboxRequestConfig }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ==================== FETCH PAGE LIST ====================

export async function fetchPageListInbox(
  allPages: any[] = [],
  cursor: string | null = null,
  sendProgress?: (count: number, isComplete: boolean) => void
): Promise<{
  success: boolean
  data?: any[]
  request_config?: Record<string, any>
  error?: string
}> {
  inboxRequestConfig.__req = generateRequest()
  const isFirstLoad = !cursor

  const variables = isFirstLoad ? { scale: 1 } : { count: 50, cursor, scale: 1 }
  const docId = isFirstLoad ? "7608279105858845" : "29849393258040848"
  const friendlyName = isFirstLoad
    ? "PagesCometLaunchpointUnifiedQueryPagesListRedesignedQuery"
    : "PagesCometLaunchPointUnifiedQueryPagesListRedesignedUpdatedPagesSectionQuery"

  const body = new URLSearchParams({
    cquick_token: inboxRequestConfig.cquick_token,
    fb_dtsg: inboxRequestConfig.fb_dtsg,
    cquick: inboxRequestConfig.cquick,
    __ccg: inboxRequestConfig.__ccg,
    dpr: String(inboxRequestConfig.dpr),
    jazoest: inboxRequestConfig.jazoest,
    __csr: inboxRequestConfig.__csr,
    __beoa: "0",
    __req: inboxRequestConfig.__req,
    __a: String(inboxRequestConfig.__a),
    ctarget: "https://www.facebook.com",
    hsi: inboxRequestConfig.__hsi,
    semr_host_bucket: inboxRequestConfig.semr_host_bucket,
    bl_hash_version: inboxRequestConfig.bl_hash_version,
    comet_env: String(inboxRequestConfig.comet_env),
    wbloks_env: inboxRequestConfig.wbloks_env,
    ef_page: "BusinessCometBizSuiteInboxAllMessagesRoute",
    compose_bootloads: inboxRequestConfig.compose_bootloads,
    spin: inboxRequestConfig.spin,
    __spin_r: String(inboxRequestConfig.__spin_r),
    __spin_b: inboxRequestConfig.__spin_b,
    __spin_t: String(Date.now()),
    __hsi: inboxRequestConfig.__hsi,
    av: inboxRequestConfig.c_user,
    __user: inboxRequestConfig.c_user,
    fb_api_caller_class: "RelayModern",
    server_timestamps: "true",
    fb_api_req_friendly_name: friendlyName,
    variables: JSON.stringify(variables),
    doc_id: docId
  })

  try {
    const res = await fetch("https://www.facebook.com/api/graphql", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body
    })
    if (!res.ok) throw new Error("Network response was not ok")
    const text = await res.text()

    let json: any
    const labelIdx = /\s\{"label":"/gm.exec(text)
    json = labelIdx
      ? JSON.parse(text.substring(0, labelIdx.index))
      : JSON.parse(text)

    const pageData =
      json?.data?.viewer?.actor?.additional_profiles_with_biz_tools
    if (pageData?.edges?.length) {
      pageData.edges.forEach((item: any) => {
        const pageId = item.node.delegate_page_id
        if (!allPages.some((p) => p.id === pageId)) {
          allPages.push({
            id: pageId,
            name: item.node.name,
            avatar: item.node.profile_picture?.uri || "",
            type: "page"
          })
        }
      })

      const hasNextPage = pageData.page_info?.has_next_page
      const endCursor = pageData.page_info?.end_cursor
      if (sendProgress) sendProgress(allPages.length, !hasNextPage)

      if (hasNextPage && endCursor) {
        return fetchPageListInbox(allPages, endCursor, sendProgress)
      }
    }

    if (allPages.length > 0)
      return {
        success: true,
        data: allPages,
        request_config: inboxRequestConfig
      }
    return { success: false, error: "No pages found" }
  } catch (error: any) {
    if (allPages.length > 0)
      return {
        success: true,
        data: allPages,
        request_config: inboxRequestConfig
      }
    return { success: false, error: error.message }
  }
}

// ==================== FETCH INBOX THREADS ====================

export async function fetchUsersInboxBg(
  pageId: string,
  beforeCall: string | null
): Promise<{ success: boolean; data?: any; error?: any }> {
  inboxRequestConfig.__req = generateRequest()

  const body = new URLSearchParams({
    batch_name: "MessengerGraphQLThreadlistFetcher",
    av: pageId,
    queries: JSON.stringify({
      __q0__: {
        doc_id: "5947328892029037",
        query_params: { limit: 50, before: beforeCall }
      }
    }),
    cquick_token: inboxRequestConfig.cquick_token,
    fb_dtsg: inboxRequestConfig.fb_dtsg,
    cquick: inboxRequestConfig.cquick,
    __ccg: inboxRequestConfig.__ccg,
    dpr: String(inboxRequestConfig.dpr),
    jazoest: inboxRequestConfig.jazoest,
    __csr: inboxRequestConfig.__csr,
    __beoa: "0",
    __req: inboxRequestConfig.__req,
    __a: String(inboxRequestConfig.__a),
    ctarget: "https://www.facebook.com",
    hsi: inboxRequestConfig.__hsi,
    semr_host_bucket: inboxRequestConfig.semr_host_bucket,
    bl_hash_version: inboxRequestConfig.bl_hash_version,
    comet_env: String(inboxRequestConfig.comet_env),
    wbloks_env: inboxRequestConfig.wbloks_env,
    ef_page: "BusinessCometBizSuiteInboxAllMessagesRoute",
    compose_bootloads: inboxRequestConfig.compose_bootloads,
    spin: inboxRequestConfig.spin,
    __spin_r: String(inboxRequestConfig.__spin_r),
    __spin_b: inboxRequestConfig.__spin_b,
    __spin_t: String(Math.floor(Date.now() / 1000)),
    __hsi: inboxRequestConfig.__hsi
  })

  try {
    const res = await fetch("https://www.facebook.com/api/graphqlbatch/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body
    })
    if (!res.ok) throw new Error("Network response was not ok")
    const text = await res.text()

    if (text.includes('"error":') && text.includes('"errorSummary"')) {
      const errorMatch = text.match(/"error":\s*(\d+)/)
      const errorDescMatch = text.match(/"errorDescription":\s*"([^"]+)"/)
      const errorSummaryMatch = text.match(/"errorSummary":\s*"([^"]+)"/)
      return {
        success: false,
        error: {
          error: errorMatch ? parseInt(errorMatch[1]) : "Unknown",
          errorDescription: errorDescMatch?.[1] ?? "",
          errorSummary: errorSummaryMatch?.[1] ?? ""
        }
      }
    }

    const cleaned = text.replace(
      '{"successful_results":1,"error_results":0,"skipped_results":0}',
      ""
    )
    return { success: true, data: JSON.parse(cleaned) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}


// ==================== FETCH IMAGE TO BASE64 ====================

export async function fetchImageToBase64Bg(
  url: string
): Promise<{
  success: boolean
  base64?: string
  size?: number
  message?: string
}> {
  if (!url?.startsWith("http"))
    return { success: false, message: "Invalid URL" }

  const urls = [url]
  if (url.includes("scontent")) {
    const large = url
      .replace(/\/s\d+x\d+\//g, "/s200x200/")
      .replace(/\/p\d+x\d+\//g, "/p200x200/")
    if (large !== url) urls.unshift(large)
  }

  for (const u of urls) {
    try {
      const res = await fetch(u, { redirect: "follow" })
      if (!res.ok) continue
      const ct = res.headers.get("Content-Type") ?? ""
      if (!ct.includes("image")) continue
      const blob = await res.blob()
      if (blob.size < 100) continue
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      return { success: true, base64, size: blob.size }
    } catch {
      continue
    }
  }

  return { success: false, message: "All URLs failed" }
}

// ==================== GET / SET CONFIG ====================

export function getInboxRequestConfig(): Record<string, any> {
  return inboxRequestConfig
}
