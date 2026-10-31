import axios from "axios"

import { fbAxiosInstance } from "src/configs/axios.config"
import { ESocialProvider } from "src/constants/enum"
import { SINGLE_DOWNLOAD_URL_PATTERNS } from "src/constants/regex.constants"
import { MAX_RETRY_REQUEST, REQUEST_ACCEPT_HEADER } from "src/constants/app.constants"
import useAuthStore from "src/stores/auth.store"
import { chromeUtils } from "src/utils/chrome.util"
import { IFacebookAccount } from "src/modules/facebook/types/account.types"
import { IMediaItem, IPagedResult } from "src/modules/download/types/download.types"
import { ESingleDownloadType } from "src/constants/enum"
import {
  IFacebookPost,
  IFacebookPostInfo,
  IFacebookPostMediaDetails,
  IFacebookProfileInfo,
  IFacebookStory,
  IFacebookStoryDetails,
  IFacebookVideoDetails
} from "src/modules/facebook/types/facebook.types"

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const makeRequestToFb = async (docID: string, query: any) => {
  try {
    const fbAccountData = useAuthStore.getState().accounts[ESocialProvider.FACEBOOK]
    if (!fbAccountData) {
      throw new Error("Vui lòng xác thực tài khoản Facebook trước")
    }
    const formData = new FormData()
    formData.set("__a", "1")
    formData.set("__comet_req", "15")
    formData.set("fb_dtsg", fbAccountData.fbDtsg)
    formData.set("av", fbAccountData.id)
    formData.set("doc_id", docID)
    formData.set("variables", JSON.stringify(query))
    const { data } = await fbAxiosInstance.post("/", formData)
    return data
  } catch (error) {
    throw new Error("Đã xảy ra lỗi khi gửi yêu cầu đến Facebook", { cause: error })
  }
}

/** GraphQL sometimes answers with NDJSON; keep only the first JSON line. */
const parseFirstJsonLine = (data: unknown): any => {
  if (typeof data !== "string") return data
  try {
    return JSON.parse(data.split("\n")[0] ?? "null")
  } catch {
    return null
  }
}

/** Pick the HD progressive url, falling back to SD. */
const pickProgressiveUrl = (progressiveUrls: any[] | undefined): string => {
  if (!Array.isArray(progressiveUrls)) return ""
  const hd = progressiveUrls.find((u) => u?.metadata?.quality === "HD")?.progressive_url
  const sd = progressiveUrls.find((u) => u?.metadata?.quality === "SD")?.progressive_url
  return hd || sd || ""
}

/**
 * Extract the JSON object that directly follows `marker` in a page source,
 * e.g. `"profile_header_renderer":{...}` → the `{...}` part, by brace matching.
 */
const extractObjectFromString = (source: string, marker: string): any => {
  const markerIndex = source.indexOf(marker)
  if (markerIndex === -1) return null
  const start = source.indexOf("{", markerIndex + marker.length)
  if (start === -1) return null
  let depth = 0
  let inString = false
  for (let i = start; i < source.length; i++) {
    const ch = source[i]
    if (inString) {
      if (ch === "\\") i += 1
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === "{") depth += 1
    else if (ch === "}") {
      depth -= 1
      if (depth === 0) {
        try {
          return JSON.parse(source.slice(start, i + 1))
        } catch {
          return null
        }
      }
    }
  }
  return null
}

/** Depth-first search for the first `key` whose value satisfies `condition(value, parent)`. */
const findByKey = (
  data: any,
  key: string,
  condition: (value: any, parent: any) => boolean = () => true
): any => {
  const stack: any[] = [data]
  const seen = new Set<any>()
  while (stack.length) {
    const current = stack.pop()
    if (!current || typeof current !== "object" || seen.has(current)) continue
    seen.add(current)
    if (!Array.isArray(current) && key in current && condition(current[key], current)) {
      return current[key]
    }
    const children = Array.isArray(current) ? current : Object.values(current)
    for (const child of children) stack.push(child)
  }
  return undefined
}

/** Last GraphQL error message seen (surfaced to the user when every attempt fails) */
let lastGraphqlError = ""
export const getLastGraphqlError = () => lastGraphqlError

/** Log + remember a GraphQL failure so the UI can show the real reason */
const noteGraphqlFailure = (docID: string, response: any) => {
  const errors = response?.errors
  const message = Array.isArray(errors)
    ? errors.map((e: any) => e?.message || e?.description || JSON.stringify(e)).join("; ")
    : typeof response === "string"
      ? response.slice(0, 200)
      : ""
  lastGraphqlError = message
  console.warn(`[Bluemaster] GraphQL doc ${docID} returned no data`, message || response)
}

/** Run fetchers in order, returning the first non-null result */
const firstSuccessful = async <T>(fetchers: (() => Promise<T | null>)[]): Promise<T | null> => {
  for (const fetcher of fetchers) {
    try {
      const result = await fetcher()
      if (result) {
        lastGraphqlError = ""
        return result
      }
    } catch (error) {
      console.warn("[Bluemaster] fetcher failed", error)
    }
  }
  return null
}

const toPagination = (pageInfo: any) => ({
  hasNextPage: !!pageInfo?.has_next_page,
  nextCursor: pageInfo?.end_cursor ?? ""
})

const unescapeFbText = (text: string) => {
  try {
    return JSON.parse(`"${text}"`) as string
  } catch {
    return text
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Account                                  */
/* -------------------------------------------------------------------------- */

const getFacebookAccountData = async () => {
  try {
    const cookies = await chromeUtils.getChromeCookies("facebook.com")
    const axiosInstance = axios.create({
      baseURL: "https://www.facebook.com",
      headers: { cookie: cookies, Accept: REQUEST_ACCEPT_HEADER }
    })
    const { data: rawData } = await axiosInstance.get("/")

    const profileRegex = /"story_bucket_owner":(.*?),"story_bucket_type":/
    const fbDtsgRegex = /"DTSGInitialData".*?"token":"(.*?)"/
    const originalProfileInfor = rawData.match(profileRegex)
    const fbDtsg = rawData.match(fbDtsgRegex)?.[1]
    if (!originalProfileInfor || !fbDtsg) {
      throw new Error()
    }
    const profileInfor = JSON.parse(originalProfileInfor[1])
    const fbAccountData: IFacebookAccount = {
      id: profileInfor.id,
      name: profileInfor.name,
      username: profileInfor.name,
      avatar: profileInfor.profile_picture.uri,
      cookies,
      fbDtsg
    }
    return fbAccountData
  } catch (error) {
    throw new Error(
      "Không thể lấy dữ liệu tài khoản Facebook. Đảm bảo rằng bạn đã đăng nhập vào Facebook trên trình duyệt", { cause: error }
    )
  }
}

const getFbIdFromUsername = async (username: string) => {
  try {
    const { data } = await fbAxiosInstance.get(`https://www.facebook.com/${username}`)
    const userId = data.match(/"userID":"(\d+)"/)[1]
    return userId as string
  } catch (error) {
    throw new Error(`Không thể lấy Facebook ID của người dùng ${username}`, { cause: error })
  }
}

const getGroupIdFromName = async (groupName: string) => {
  try {
    const { data } = await fbAxiosInstance.get(`https://www.facebook.com/groups/${groupName}`)
    const groupId = data.match(/"groupID":"(\d+)"/)[1]
    if (!groupId) {
      throw new Error()
    }
    return groupId as string
  } catch (error) {
    throw new Error(`Không thể lấy Facebook ID của nhóm ${groupName}`, { cause: error })
  }
}

const getFbIdFromUrl = async (url: string) => {
  if (!URL.canParse(url)) {
    throw new Error("URL không hợp lệ")
  }
  const { data } = await fbAxiosInstance.get(url)
  const userId = data?.match(/"userID":"(\d+)"/)?.[1]
  if (!userId) {
    throw new Error("Không thể lấy Facebook ID của người dùng từ URL")
  }
  return userId as string
}

/**
 * Profile page → id, name, active story bucket, delegate page.
 * `usernameOrId` may be a username or a numeric id.
 */
const getProfileInfo = async (usernameOrId: string): Promise<IFacebookProfileInfo> => {
  const url = /^\d+$/.test(usernameOrId)
    ? `https://www.facebook.com/profile.php?id=${usernameOrId}`
    : `https://www.facebook.com/${usernameOrId}`
  let rawData = ""
  try {
    const { data } = await fbAxiosInstance.get(url)
    rawData = typeof data === "string" ? data : ""
  } catch {
    throw new Error(`Không thể tải trang cá nhân ${usernameOrId}`)
  }
  const header = extractObjectFromString(rawData, '"profile_header_renderer"')
  const user = header?.user
  const id: string | undefined =
    user?.id ||
    rawData.match(/"profile_id":"(\d+)"/)?.[1] ||
    rawData.match(/"userID":"(\d+)"/)?.[1]
  if (!id) {
    throw new Error(`Không thể lấy Facebook ID của người dùng ${usernameOrId}`)
  }
  const tabKey = (tab: string): string | null =>
    (user &&
      findByKey(user, "id", (value, parent) => typeof value === "string" && parent?.tab_key === tab)) ||
    null
  const info: IFacebookProfileInfo = {
    id,
    name: user?.name || usernameOrId,
    storyBucketId: user?.story_bucket?.nodes?.[0]?.id || null,
    delegatePageId: user?.delegate_page?.id || null,
    photosTabKeyId: tabKey("photos_by"),
    reelsTabKeyId: tabKey("owner_reels"),
    albumsTabKeyId: tabKey("photos_albums")
  }
  console.info("[Bluemaster] profile info", info)
  return info
}

/* -------------------------------------------------------------------------- */
/*                                Bulk fetchers                               */
/* -------------------------------------------------------------------------- */

const mapPhotoEdges = (edges: any[]): IMediaItem[] =>
  edges
    .map(({ node }: any) => ({
      id: node?.node?.id as string,
      downloadUrl: node?.node?.viewer_image?.uri as string,
      mediaType: "PHOTO" as const
    }))
    .filter((item) => !!item.id && !!item.downloadUrl)

const getProfileBulkPhotos = async (
  profile: Pick<IFacebookProfileInfo, "id" | "photosTabKeyId">,
  nextCursor: string = ""
): Promise<IPagedResult<IMediaItem> | null> => {
  const run = async (docID: string, id: string) => {
    const responseData = parseFirstJsonLine(await makeRequestToFb(docID, { scale: 1, id, count: 8, cursor: nextCursor }))
    const pageItems = responseData?.data?.node?.pageItems
    if (!pageItems?.edges || !pageItems?.page_info) {
      noteGraphqlFailure(docID, responseData)
      return null
    }
    return { dataItems: mapPhotoEdges(pageItems.edges), pagination: toPagination(pageItems.page_info) }
  }
  return firstSuccessful<IPagedResult<IMediaItem>>([
    // current Facebook query, keyed by the photos tab id found on the profile page
    ...(profile.photosTabKeyId ? [() => run("24168515422830962", profile.photosTabKeyId as string)] : []),
    // legacy query built from the user id
    () => run("9464814726967704", btoa(`app_collection:${profile.id}:2305272732:5`)),
    () => run("24168515422830962", btoa(`app_collection:${profile.id}:2305272732:5`))
  ])
}

const formatReelNode = (creationStory: any): IFacebookVideoDetails | null => {
  const media = creationStory?.attachments?.[0]?.media
  if (!media) return null
  const progressiveUrls =
    media?.videoDeliveryResponseFragment?.videoDeliveryResponseResult?.progressive_urls
  const downloadUrl = pickProgressiveUrl(progressiveUrls)
  if (!downloadUrl) return null
  return {
    id: media.id,
    downloadUrl,
    mediaType: "VIDEO",
    title: creationStory?.message?.text || "",
    createdAt: creationStory?.creation_time || media?.publish_time || undefined,
    thumbnailUrl: media?.preferred_thumbnail?.image?.uri
  }
}

const REELS_QUERY_FLAGS = {
  renderLocation: null,
  useDefaultActor: false,
  __relay_internal__pv__FBReels_deprecate_short_form_video_context_gkrelayprovider: true,
  __relay_internal__pv__FBReels_enable_view_dubbed_audio_type_gkrelayprovider: false,
  __relay_internal__pv__FBReels_enable_meta_ai_label_gkrelayprovider: true,
  __relay_internal__pv__FBReelsMediaFooter_comet_enable_reels_ads_gkrelayprovider: true,
  __relay_internal__pv__FBUnifiedVideoMediaFooter_comet_enable_reels_ads_gkrelayprovider: true,
  __relay_internal__pv__FBUnifiedVideoMediaFooter_community_notes_reels_fb_web_unified_gkrelayprovider: true,
  __relay_internal__pv__FBUnifiedVideoMediaFooter_enable_meta_ai_pill_gkrelayprovider: true,
  __relay_internal__pv__FBUnifiedVideoMediaFooter_enable_ai_info_pill_gkrelayprovider: true
}

const getProfileBulkReels = async (
  profile: Pick<IFacebookProfileInfo, "id" | "reelsTabKeyId">,
  nextCursor: string = ""
): Promise<IPagedResult<IMediaItem> | null> => {
  const run = async (docID: string, id: string) => {
    const raw = await makeRequestToFb(docID, { ...REELS_QUERY_FLAGS, scale: 1, id, count: 10, cursor: nextCursor })
    const responseData = parseFirstJsonLine(raw)
    const shorts = responseData?.data?.node?.aggregated_fb_shorts
    if (!shorts?.edges || !shorts?.page_info) {
      noteGraphqlFailure(docID, responseData)
      return null
    }
    const dataItems = (shorts.edges as any[])
      .map((item) => formatReelNode(item?.profile_reel_node?.node))
      .filter((item): item is IFacebookVideoDetails => !!item)
    return { dataItems, pagination: toPagination(shorts.page_info) }
  }
  const legacyId = btoa(`app_collection:${profile.id}:168684841768375:260`)
  return firstSuccessful<IPagedResult<IMediaItem>>([
    ...(profile.reelsTabKeyId ? [() => run("25443625298595118", profile.reelsTabKeyId as string)] : []),
    () => run("9608255752564845", legacyId),
    () => run("25443625298595118", legacyId)
  ])
}

const getProfileBulkHighlightsId = async (
  userId: string,
  nextCursor: string = ""
): Promise<IPagedResult<string> | null> => {
  const run = async (docID: string, section: string) => {
    const id = btoa(
      `profile_tile_view:${userId}:${section}:intro_featured_highlights_content:hscroll_cards:profile_timeline:3:7`
    )
    const responseData = parseFirstJsonLine(
      await makeRequestToFb(docID, { scale: 1, id, count: 9, cursor: nextCursor })
    )
    const tileItems = responseData?.data?.node?.profile_tile_items
    if (!tileItems?.edges || !tileItems?.page_info) {
      noteGraphqlFailure(docID, responseData)
      return null
    }
    const dataItems: string[] = (tileItems.edges as any[])
      .map(({ node }) => node?.node?.id)
      .filter(Boolean)
    return { dataItems, pagination: toPagination(tileItems.page_info) }
  }
  return firstSuccessful<IPagedResult<string>>([
    () => run("29865722229740235", "featured_highlights"),
    () => run("9516333321764857", "intro"),
    () => run("29865722229740235", "intro")
  ])
}

const getPhotoDownloadUrl = async (photoId: string, userId?: string): Promise<string> => {
  // 1) media viewer query (current): the original-size uri is in prefetch_uris_v2
  try {
    const raw = await makeRequestToFb("26823688820652915", {
      feedbackSource: 65,
      feedLocation: "COMET_MEDIA_VIEWER",
      focusCommentID: null,
      isMediaset: false,
      nodeID: photoId,
      privacySelectorRenderLocation: "COMET_MEDIA_VIEWER",
      renderLocation: "comet_media_viewer",
      scale: 1,
      useDefaultActor: false,
      __relay_internal__pv__GHLShouldChangeSponsoredDataFieldNamerelayprovider: true,
      __relay_internal__pv__TestPilotShouldIncludeDemoAdUseCaserelayprovider: false,
      __relay_internal__pv__CometUFIShareActionMigrationrelayprovider: true,
      __relay_internal__pv__CometUFICommentAutoTranslationTyperelayprovider: "AUTO_TRANSLATE",
      __relay_internal__pv__CometUFICommentAvatarStickerAnimatedImagerelayprovider: false,
      __relay_internal__pv__CometUFICommentActionLinksRewriteEnabledrelayprovider: false,
      __relay_internal__pv__IsWorkUserrelayprovider: false,
      __relay_internal__pv__CometUFIReactionsEnableShortNamerelayprovider: false,
      __relay_internal__pv__CometUFISingleLineUFIrelayprovider: true,
      __relay_internal__pv__CometImmersivePhotoCanUserDisable3DMotionrelayprovider: false
    })
    const text = typeof raw === "string" ? raw : JSON.stringify(raw)
    const uri = text.match(/"prefetch_uris_v2":\[\{"uri":"([^"]+)"/)?.[1]
    if (uri) return unescapeFbText(uri)
    const viewerImage = parseFirstJsonLine(raw)?.data?.currMedia?.image?.uri
    if (viewerImage) return viewerImage
  } catch (error) {
    console.warn("[Bluemaster] photo viewer query failed", error)
  }
  // 2) legacy download-menu query
  if (userId) {
    const docID = "9230003843719229"
    const responseData = parseFirstJsonLine(
      await makeRequestToFb(docID, {
        feed_location: "COMET_MEDIA_VIEWER",
        id: btoa(`S:_I${userId}:VK:${photoId}`),
        scale: 1
      })
    )
    const menuItems = responseData?.data?.node?.nfx_action_menu_items
    const downloadLink = menuItems?.find(
      (item: any) => item.__typename === "PhotoDownloadMenuItem"
    )?.story?.attachments?.[0]?.media?.download_link
    if (downloadLink) return downloadLink as string
    noteGraphqlFailure(docID, responseData)
  }
  throw new Error("Không thể lấy link tải ảnh")
}

const mapStoryEdges = (edges: any[]): IFacebookStory[] =>
  edges
    .map((edge): IFacebookStory | undefined => {
      const media = edge?.node?.attachments?.[0]?.media
      if (!media) return undefined
      if (media.__isMedia === "Video") {
        return {
          id: media.id,
          downloadUrl: pickProgressiveUrl(
            media?.videoDeliveryResponseFragment?.videoDeliveryResponseResult?.progressive_urls
          ),
          mediaType: "VIDEO",
          thumbnailUrl: media?.previewImage?.uri || media?.preferred_thumbnail?.image?.uri
        }
      }
      return { id: media.id, downloadUrl: media?.image?.uri, mediaType: "PHOTO" }
    })
    .filter((story): story is IFacebookStory => !!story && !!story.downloadUrl)

/** Story / highlight bucket: owner + media list */
const getStoryDetails = async (bucketId: string): Promise<IFacebookStoryDetails> => {
  // 1) current structured query
  try {
    const docID = "25170215872629838"
    const responseData = parseFirstJsonLine(
      await makeRequestToFb(docID, { bucketID: bucketId, focusCommentID: null, scale: 1 })
    )
    const bucket = responseData?.data?.bucket
    const edges = bucket?.unified_stories_with_notes?.edges ?? bucket?.unified_stories?.edges
    const owner = bucket?.story_bucket_owner
    if (Array.isArray(edges) && owner?.id) {
      return {
        id: bucketId,
        ownerId: owner.id,
        ownerName: owner.name || "",
        title: bucket?.name || owner.name || "",
        storiesMedia: mapStoryEdges(edges)
      }
    }
    noteGraphqlFailure(docID, responseData)
  } catch (error) {
    console.warn("[Bluemaster] story query failed", error)
  }
  // 2) legacy text query parsed with regex
  return getStoryDetailsLegacy(bucketId)
}

const getStoryDetailsLegacy = async (bucketId: string): Promise<IFacebookStoryDetails> => {
  try {
    let retryCount = 0
    while (true) {
      const data = await makeRequestToFb("8367440913325249", {
        bucketID: bucketId,
        focusCommentID: null,
        scale: 1
      })
      if (typeof data !== "string") {
        retryCount += 1
        if (retryCount > MAX_RETRY_REQUEST) {
          throw new Error()
        }
        continue
      }

      const storiesDataString = data.match(/"unified_stories":\{"edges":(.*?)\},"owner":\{/)
      const ownerMatch = data.match(/"__isNode":"User","id":"(.*?)","name":"(.*?)"/)
      const bucketNameMatch = data.match(/"bucket":\{[^{}]*?"name":"(.*?)"/)

      if (storiesDataString?.[1] && ownerMatch?.[1]) {
        const ownerId = ownerMatch[1]
        const ownerName = unescapeFbText(ownerMatch[2] || "")
        const storiesData: any[] = JSON.parse(storiesDataString[1])

        const storiesMedia = storiesData
          .map((story): IFacebookStory | undefined => {
            const media = story?.node?.attachments?.[0]?.media
            if (!media) return undefined
            const isVideo = media.__isMedia === "Video"
            if (isVideo) {
              const downloadUrl = pickProgressiveUrl(
                media?.videoDeliveryResponseFragment?.videoDeliveryResponseResult
                  ?.progressive_urls
              )
              return {
                id: media.id,
                downloadUrl,
                mediaType: "VIDEO",
                thumbnailUrl:
                  media?.previewImage?.uri || media?.preferred_thumbnail?.image?.uri
              }
            }
            return {
              id: media.id,
              downloadUrl: media?.image?.uri,
              mediaType: "PHOTO"
            }
          })
          .filter((story): story is IFacebookStory => !!story && !!story.downloadUrl)
        return {
          id: bucketId,
          ownerId,
          ownerName,
          title: bucketNameMatch?.[1] ? unescapeFbText(bucketNameMatch[1]) : ownerName,
          storiesMedia
        }
      }
      retryCount += 1
      if (retryCount > MAX_RETRY_REQUEST) {
        throw new Error()
      }
    }
  } catch (error) {
    throw new Error("Đã xảy ra lỗi khi lấy dữ liệu story", { cause: error })
  }
}

const getVideoDetails = async (videoIdOrUrl: string): Promise<IFacebookVideoDetails> => {
  let videoId = videoIdOrUrl
  if (URL.canParse(videoIdOrUrl)) {
    for (const pattern of SINGLE_DOWNLOAD_URL_PATTERNS[ESingleDownloadType.FACEBOOK_VIDEO]) {
      const m = videoIdOrUrl.match(pattern)
      if (m?.[1]) {
        videoId = m[1]
        break
      }
    }
  }

  // 1) GraphQL reel/video root query (returns title + creation time)
  if (/^\d+$/.test(videoId)) {
    try {
      const raw = await makeRequestToFb("25333743559590947", {
        count: 1,
        initial_node_id: videoId,
        isAggregationProfileViewerOrShouldShowReelsForPage: false,
        page_id: "",
        scale: 1,
        should_use_stream: false,
        shouldIncludeInitialNodeFetch: true,
        shouldShowReelsForPage: false,
        stream_initial_count: 1,
        useDefaultActor: false,
        __relay_internal__pv__FBUnifiedVideoMediaFooter_comet_enable_reels_ads_gkrelayprovider: true,
        __relay_internal__pv__FBUnifiedVideoMediaFooter_community_notes_reels_fb_web_unified_gkrelayprovider: true,
        __relay_internal__pv__FBReels_enable_view_dubbed_audio_type_gkrelayprovider: false,
        __relay_internal__pv__FBUnifiedVideoMediaFooter_enable_meta_ai_pill_gkrelayprovider: true,
        __relay_internal__pv__FBUnifiedVideoMediaFooter_enable_ai_info_pill_gkrelayprovider: true
      })
      const video = parseFirstJsonLine(raw)?.data?.video
      const details = formatReelNode(video?.creation_story)
      if (details) return { ...details, id: details.id || videoId }
    } catch {
      // fall through to page scraping
    }
  }

  // 2) Page source scraping (legacy path)
  try {
    const pageUrl = URL.canParse(videoIdOrUrl)
      ? videoIdOrUrl
      : `https://www.facebook.com/watch/?v=${videoId}`
    const { data } = await fbAxiosInstance.get(pageUrl)
    const html: string = typeof data === "string" ? data : ""
    const match = html.match(/"progressive_urls":(.*?),"hls_playlist_urls":/)
    if (!match) throw new Error()
    const downloadUrl = pickProgressiveUrl(JSON.parse(match[1]))
    if (!downloadUrl) throw new Error()
    const title =
      html.match(/"savable_title":\{"text":"(.*?)"\}/)?.[1] ??
      html.match(/"title":\{"text":"(.*?)"\}/)?.[1] ??
      ""
    const createdAt = Number(
      html.match(/"publish_time":(\d+)/)?.[1] ?? html.match(/"creation_time":(\d+)/)?.[1] ?? 0
    )
    return {
      id: videoId,
      downloadUrl,
      mediaType: "VIDEO",
      title: title ? unescapeFbText(title) : "",
      createdAt: createdAt || undefined
    }
  } catch (error) {
    throw new Error("Đã xảy ra lỗi khi lấy link tải video", { cause: error })
  }
}

const getVideoDownloadUrl = async (videoIdOrUrl: string) =>
  (await getVideoDetails(videoIdOrUrl)).downloadUrl

/** Per-item detail resolution that tolerates individual failures */
const resolveVideoItems = async (videoIds: string[]) => {
  const settled = await Promise.allSettled(videoIds.map((id) => getVideoDetails(id)))
  return settled
    .filter((r): r is PromiseFulfilledResult<IFacebookVideoDetails> => r.status === "fulfilled")
    .map((r) => r.value)
}

const getProfileBulkVideos = async (
  profile: Pick<IFacebookProfileInfo, "id" | "delegatePageId">,
  nextCursor: string = ""
): Promise<IPagedResult<IMediaItem> | null> => {
  const runCollection = async (docID: string) => {
    const responseData = parseFirstJsonLine(
      await makeRequestToFb(docID, {
        scale: 1,
        id: btoa(`app_collection:${profile.id}:1560653304174514:133`),
        count: 8,
        cursor: nextCursor
      })
    )
    const pageItems = responseData?.data?.node?.pageItems
    if (!pageItems?.edges || !pageItems?.page_info) {
      noteGraphqlFailure(docID, responseData)
      return null
    }
    const videoIds: string[] = (pageItems.edges as any[]).map(({ node }) => node?.node?.id).filter(Boolean)
    return { dataItems: await resolveVideoItems(videoIds), pagination: toPagination(pageItems.page_info) }
  }
  // Professional profiles expose their videos through the backing page
  const runPage = async () => {
    const pageId = profile.delegatePageId as string
    const docID = "26070921649175153"
    const responseData = parseFirstJsonLine(
      await makeRequestToFb(docID, {
        alwaysIncludeAudioRooms: true,
        count: 6,
        ...(nextCursor && { cursor: nextCursor }),
        pageID: pageId,
        scale: 4,
        showReactions: true,
        useDefaultActor: false,
        id: pageId
      })
    )
    const allVideos = responseData?.data?.node?.all_videos
    if (!allVideos?.edges || !allVideos?.page_info) {
      noteGraphqlFailure(docID, responseData)
      return null
    }
    const videoIds: string[] = (allVideos.edges as any[]).map(({ node }) => node?.id).filter(Boolean)
    return { dataItems: await resolveVideoItems(videoIds), pagination: toPagination(allVideos.page_info) }
  }
  return firstSuccessful<IPagedResult<IMediaItem>>([
    () => runCollection("27205790585732100"),
    ...(profile.delegatePageId ? [runPage] : [])
  ])
}

const getGroupBulkVideos = async (
  groupID: string,
  nextCursor: string = ""
): Promise<IPagedResult<IMediaItem> | null> => {
  const run = async (docID: string) => {
    const responseData = parseFirstJsonLine(
      await makeRequestToFb(docID, { count: 8, cursor: nextCursor, scale: 1, id: groupID })
    )
    const media = responseData?.data?.node?.group_mediaset?.media
    if (!media?.edges || !media?.page_info) {
      noteGraphqlFailure(docID, responseData)
      return null
    }
    const videoIds: string[] = (media.edges as any[]).map(({ node }) => node?.id).filter(Boolean)
    return { dataItems: await resolveVideoItems(videoIds), pagination: toPagination(media.page_info) }
  }
  return firstSuccessful<IPagedResult<IMediaItem>>([
    () => run("9767488053296437"),
    () => run("9352040021563569")
  ])
}

const getGroupBulkPhotos = async (
  groupID: string,
  nextCursor: string = ""
): Promise<IPagedResult<IMediaItem> | null> => {
  const run = async (docID: string) => {
    const responseData = parseFirstJsonLine(
      await makeRequestToFb(docID, { count: 8, cursor: nextCursor, scale: 1, id: groupID })
    )
    const media = responseData?.data?.node?.group_mediaset?.media
    if (!media?.edges || !media?.page_info) {
      noteGraphqlFailure(docID, responseData)
      return null
    }
    const photos = (media.edges as any[])
      .map(({ node }) => ({ photoId: node?.id as string, ownerId: node?.owner?.id as string | undefined }))
      .filter((p) => !!p.photoId)
    const settled = await Promise.allSettled(
      photos.map(async ({ photoId, ownerId }): Promise<IMediaItem> => ({
        id: photoId,
        downloadUrl: await getPhotoDownloadUrl(photoId, ownerId),
        mediaType: "PHOTO"
      }))
    )
    return {
      dataItems: settled
        .filter((r): r is PromiseFulfilledResult<IMediaItem> => r.status === "fulfilled")
        .map((r) => r.value),
      pagination: toPagination(media.page_info)
    }
  }
  return firstSuccessful<IPagedResult<IMediaItem>>([
    () => run("8943995049039923"),
    () => run("30127100086888552")
  ])
}

const getBulkAlbumMediaById = async (
  albumId: string,
  nextCursor: string = ""
): Promise<IPagedResult<IFacebookPost> | null> => {
  const run = async (docID: string) => {
    const responseData = parseFirstJsonLine(
      await makeRequestToFb(docID, { count: 14, cursor: nextCursor, scale: 1, id: albumId })
    )
    const gridMedia = responseData?.data?.node?.grid_media
    if (!gridMedia?.edges || !gridMedia?.page_info) {
      noteGraphqlFailure(docID, responseData)
      return null
    }
    const items = (gridMedia.edges as any[]).map(({ node }) => ({
      id: node?.id as string,
      ownerId: node?.owner?.id as string | undefined,
      isVideo: node?.__isMedia === "Video"
    }))
    const settled = await Promise.allSettled(
      items.map(async ({ id, isVideo, ownerId }): Promise<IFacebookPost> => {
        if (isVideo) {
          const details = await getVideoDetails(id)
          return { ...details, id }
        }
        return { id, downloadUrl: await getPhotoDownloadUrl(id, ownerId), mediaType: "PHOTO" }
      })
    )
    return {
      dataItems: settled
        .filter((r): r is PromiseFulfilledResult<IFacebookPost> => r.status === "fulfilled")
        .map((r) => r.value),
      pagination: toPagination(gridMedia.page_info)
    }
  }
  return firstSuccessful<IPagedResult<IFacebookPost>>([
    () => run("9026124860850231"),
    () => run("9790988340981785")
  ])
}

/* -------------------------------------------------------------------------- */
/*                                 Post media                                 */
/* -------------------------------------------------------------------------- */

/** Post page → media set token, first media id, count, caption, time */
const getPostInfo = async (postUrl: string): Promise<IFacebookPostInfo> => {
  const { data: rawData } = await fbAxiosInstance.get(postUrl)
  const html: string = typeof rawData === "string" ? rawData : ""
  const attachmentsJson =
    html.match(/"frame_sublayout_subattachments":(.*?),"mediaset_token"/)?.[1] ||
    html.match(/"all_subattachments":(.*?),"comet_product_tag_feed_overlay_renderer"/)?.[1]
  const mediasetToken = html.match(/"mediaset_token":"(.*?)"/)?.[1]
  if (!attachmentsJson || !mediasetToken) {
    throw new Error("Không thể lấy dữ liệu media của bài viết")
  }
  let attachments: any
  try {
    attachments = JSON.parse(attachmentsJson)
  } catch {
    throw new Error("Không thể lấy dữ liệu media của bài viết")
  }
  const firstMediaId = attachments?.nodes?.[0]?.media?.id
  if (!firstMediaId) {
    throw new Error("Không thể lấy dữ liệu media của bài viết")
  }
  const postId =
    html.match(/"post_id":"(\d+)"/)?.[1] ??
    html.match(/"storyID":"(.*?)"/)?.[1] ??
    mediasetToken
  const title = html.match(/"message":\{"text":"(.*?)"(?:,|\})/)?.[1]
  const createdAt = Number(html.match(/"creation_time":(\d+)/)?.[1] ?? 0)
  return {
    postId,
    title: title ? unescapeFbText(title) : "",
    createdAt,
    totalMedia: Number(attachments?.count ?? attachments?.nodes?.length ?? 1),
    firstMediaId,
    mediasetToken
  }
}

/** One media of a post + the id of the next one (media viewer pagination) */
const getPostMediaDetails = async (
  mediaId: string,
  mediasetToken: string
): Promise<IFacebookPostMediaDetails> => {
  const docID = "9478994358856279"
  const query = {
    isMediaset: true,
    renderLocation: "comet_media_viewer",
    mediasetToken,
    scale: 1,
    feedLocation: "COMET_MEDIA_VIEWER",
    nodeID: mediaId
  }
  let retryCount = 0
  while (true) {
    const responseData = await makeRequestToFb(docID, query)
    if (typeof responseData === "string") {
      const mediaData = parseFirstJsonLine(responseData)?.data?.mediaset?.currMedia?.edges?.[0]?.node
      const nextRaw = responseData.match(/"nextMediaAfterNodeId":(.*?)\},"extensions":/)?.[1]
      if (mediaData) {
        let nextMediaId: string | null = null
        try {
          nextMediaId = nextRaw ? (JSON.parse(nextRaw)?.id ?? null) : null
        } catch {
          nextMediaId = null
        }
        const isVideo = mediaData.__isMedia === "Video"
        const downloadUrl = isVideo
          ? pickProgressiveUrl(
              mediaData?.videoDeliveryResponseFragment?.videoDeliveryResponseResult
                ?.progressive_urls
            )
          : mediaData?.image?.uri
        if (!downloadUrl) throw new Error("Không thể lấy link tải media của bài viết")
        return {
          id: mediaData.id ?? mediaId,
          downloadUrl,
          mediaType: isVideo ? "VIDEO" : "PHOTO",
          nextMediaId
        }
      }
    }
    retryCount += 1
    if (retryCount >= MAX_RETRY_REQUEST) {
      throw new Error("Không thể lấy dữ liệu media của bài viết")
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                               Comment videos                               */
/* -------------------------------------------------------------------------- */

const getCommentData = async (commentUrl: string) => {
  try {
    const { data: rawData } = await fbAxiosInstance.get(commentUrl)
    const postId = rawData.match(/"post_id":"(.*?)"/)?.[1]
    if (!postId) {
      throw new Error()
    }
    const commentId = new URL(commentUrl).searchParams.get("comment_id")
    if (!commentId) {
      throw new Error()
    }
    const docID = "28843177298663113"
    const baseQuery = {
      commentsIntentToken: "RANKED_UNFILTERED_CHRONOLOGICAL_REPLIES_INTENT_V1",
      feedLocation: "TAHOE",
      focusCommentID: null,
      scale: 1,
      useDefaultActor: false,
      id: btoa(`feedback:${postId}`),
      __relay_internal__pv__IsWorkUserrelayprovider: false
    }
    let retryCount = 0
    let nextCursor = ""
    let hasNextPage = true
    while (true) {
      const query = { ...baseQuery, ...(nextCursor && { commentsAfterCursor: nextCursor }) }
      const responseData = parseFirstJsonLine(await makeRequestToFb(docID, query))
      const originalCommentDataList =
        responseData?.data?.node?.comment_rendering_instance_for_feed_location?.comments?.edges
      const pageInfor =
        responseData?.data?.node?.comment_rendering_instance_for_feed_location?.comments?.page_info
      if (!originalCommentDataList || !pageInfor) {
        retryCount += 1
        if (retryCount > MAX_RETRY_REQUEST) {
          throw new Error()
        }
        continue
      }
      retryCount = 0
      hasNextPage = pageInfor.has_next_page
      nextCursor = pageInfor.end_cursor
      const commentData = originalCommentDataList.find(
        ({ node }: any) => node.legacy_fbid === commentId
      )
      if (!commentData) {
        if (!hasNextPage) return null
        continue
      }
      const expansionToken = commentData.node.feedback.expansion_info.expansion_token
      const haveReply = !!commentData.node.feedback.replies_fields.total_count
      const downloadUrl = pickProgressiveUrl(
        commentData.node.attachments[0].style_type_renderer.attachment.media
          .videoDeliveryResponseFragment.videoDeliveryResponseResult.progressive_urls
      )
      return { commentId, postId, expansionToken, haveReply, videoDownloadUrl: downloadUrl }
    }
  } catch (error) {
    throw new Error("Đã xảy ra lỗi khi lấy dữ liệu bình luận", { cause: error })
  }
}

const getReplyCommentData = async (
  commentId: string,
  {
    expansionToken,
    postId,
    parentCommentId
  }: { postId: string; expansionToken: string; parentCommentId: string }
) => {
  try {
    let retryCount = 0
    let hasNextPage = true
    let nextCursor = ""
    const docID = "23910019488599200"
    const baseQuery = {
      clientKey: null,
      expansionToken,
      feedLocation: "DEDICATED_COMMENTING_SURFACE",
      focusCommentID: null,
      repliesAfterCount: null,
      repliesAfterCursor: null,
      repliesBeforeCount: null,
      repliesBeforeCursor: null,
      scale: 1,
      useDefaultActor: false,
      id: btoa(`feedback:${postId}_${parentCommentId}`),
      __relay_internal__pv__IsWorkUserrelayprovider: false
    }
    while (true) {
      const query = { ...baseQuery, ...(nextCursor && { repliesAfterCursor: nextCursor }) }
      const responseData = parseFirstJsonLine(await makeRequestToFb(docID, query))
      const originalCommentDataList = responseData?.data?.node?.replies_connection?.edges
      const pageInfor = responseData?.data?.node?.replies_connection?.page_info
      if (!originalCommentDataList || !pageInfor) {
        retryCount += 1
        if (retryCount > MAX_RETRY_REQUEST) {
          throw new Error()
        }
        continue
      }
      retryCount = 0
      hasNextPage = pageInfor.has_next_page
      nextCursor = pageInfor.end_cursor
      const commentData = originalCommentDataList.find(
        ({ node }: any) => node.legacy_fbid === commentId
      )
      if (!commentData) {
        if (!hasNextPage) return null
        continue
      }
      const downloadUrl = pickProgressiveUrl(
        commentData.node.attachments[0].style_type_renderer.attachment.media
          .videoDeliveryResponseFragment.videoDeliveryResponseResult.progressive_urls
      )
      return { videoDownloadUrl: downloadUrl }
    }
  } catch (error) {
    throw new Error("Đã xảy ra lỗi khi lấy dữ liệu bình luận trả lời", { cause: error })
  }
}

/** Resolve the video attached to a comment (or reply) URL */
/**
 * Numeric post id from any post URL: query params (story_fbid, multi_permalinks, fbid),
 * a numeric path segment (/posts/123, /permalink/123), or, for pfbid links, the page
 * source fetched with the logged-in session.
 */
const getPostIdFromUrl = async (postUrl: string): Promise<string> => {
  const normalized = postUrl.startsWith("http") ? postUrl : `https://${postUrl}`
  try {
    const u = new URL(normalized)
    for (const key of ["story_fbid", "multi_permalinks", "fbid"]) {
      const v = u.searchParams.get(key)
      if (v && /^\d+$/.test(v)) return v
    }
    const segments = u.pathname.split("/").filter(Boolean)
    const numeric = [...segments].reverse().find((seg) => /^\d{6,}$/.test(seg))
    if (numeric) return numeric
  } catch {
    // fall through to page scraping
  }
  const { data } = await fbAxiosInstance.get(normalized)
  const html: string = typeof data === "string" ? data : ""
  const id =
    html.match(/"post_id":"(\d+)"/)?.[1] ??
    html.match(/"storyID":"(\d+)"/)?.[1] ??
    html.match(/"story_fbid":"(\d+)"/)?.[1] ??
    html.match(/"subscription_target_id":"(\d+)"/)?.[1]
  if (!id) {
    throw new Error("Không lấy được ID bài viết từ đường dẫn")
  }
  return id
}

const getCommentVideoDownloadUrl = async (commentUrl: string): Promise<{ id: string; downloadUrl: string }> => {
  const parsed = new URL(commentUrl)
  const parentCommentId = parsed.searchParams.get("comment_id")
  const replyCommentId = parsed.searchParams.get("reply_comment_id")
  const commentId = replyCommentId || parentCommentId
  if (!commentId) {
    throw new Error("URL bình luận không hợp lệ")
  }

  // Fast path: the video is inlined in the page source
  try {
    const { data: rawData } = await fbAxiosInstance.get(commentUrl)
    const videoDataRegex = new RegExp(
      `"legacy_fbid":"${commentId}".*?"attachments":(\\[.*?\\])(?=,"is_markdown_enabled")`
    )
    const videoDataMatch = (rawData as string).match(videoDataRegex)
    if (videoDataMatch) {
      const videoData = JSON.parse(videoDataMatch[1])
      const downloadUrl = pickProgressiveUrl(
        videoData[0].style_type_renderer.attachment.media.videoDeliveryResponseFragment
          .videoDeliveryResponseResult.progressive_urls
      )
      if (downloadUrl) return { id: commentId, downloadUrl }
    }
  } catch {
    // fall back to GraphQL paging below
  }

  const parentCommentData = await getCommentData(commentUrl)
  if (!parentCommentData) {
    throw new Error("Không tìm thấy video trong bình luận")
  }
  if (!replyCommentId) {
    return { id: parentCommentData.commentId, downloadUrl: parentCommentData.videoDownloadUrl }
  }
  if (!parentCommentData.haveReply) {
    throw new Error("Không tìm thấy video trong bình luận trả lời")
  }
  const childCommentData = await getReplyCommentData(replyCommentId, {
    parentCommentId: parentCommentData.commentId,
    expansionToken: parentCommentData.expansionToken,
    postId: parentCommentData.postId
  })
  if (!childCommentData?.videoDownloadUrl) {
    throw new Error("Không tìm thấy video trong bình luận trả lời")
  }
  return { id: replyCommentId, downloadUrl: childCommentData.videoDownloadUrl }
}

const facebookService = {
  makeRequestToFb,
  getFacebookAccountData,
  getFbIdFromUsername,
  getGroupIdFromName,
  getFbIdFromUrl,
  getProfileInfo,
  getStoryDetails,
  getVideoDetails,
  getVideoDownloadUrl,
  getPostInfo,
  getPostIdFromUrl,
  getPostMediaDetails,
  getPhotoDownloadUrl,
  getProfileBulkPhotos,
  getGroupBulkPhotos,
  getProfileBulkReels,
  getProfileBulkVideos,
  getGroupBulkVideos,
  getProfileBulkHighlightsId,
  getBulkAlbumMediaById,
  getCommentData,
  getReplyCommentData,
  getCommentVideoDownloadUrl
}

export default facebookService
