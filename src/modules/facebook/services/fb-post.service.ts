/**
 * Facebook post requests ported from xthuy-social `fb-post-api.ts`: create
 * group / timeline posts (text, photos, video, share link), react, comment,
 * upload media, and read group / profile / page feeds and post search.
 *
 * Plain async functions (no React / toast / i18n). Session tokens come from
 * `getSessionTokens()`; requests go through `fbFetch` (same-origin direct,
 * other hosts or Page identity relayed via the service worker) and the
 * service worker's `INBOX_UPLOAD_MEDIA` / `UPLOAD_VIDEO_CHUNK` actions.
 */
import {
  fbFetch,
  getSessionTokens,
  sendBgAction,
  type FbFetchInit,
  type FbFetchResult
} from "src/modules/facebook/services/fb-graphql.service"
import type {
  CkSearchPost,
  FbFeedPost,
  FbSourcePost,
  PostToGroupParams,
  PostToGroupResult,
  SearchPostsPageResult,
  ShareLinkPreview
} from "src/modules/facebook/types/fb-post.types"
import { fetchTokenEAAB } from "src/modules/facebook/utils/facebook.util"
import {
  deepGet,
  extractVideoId,
  findDeep,
  findGroupIdInSections,
  parseGraphqlChunks,
  parseGraphqlResponse,
  parseJsonResponse,
  postIdFromStory
} from "src/modules/facebook/utils/fb-parser.util"

export type {
  CkSearchPost,
  FbFeedPost,
  FbSourcePost,
  PostToGroupParams,
  PostToGroupResult,
  SearchPostsPageResult,
  ShareLinkPreview
} from "src/modules/facebook/types/fb-post.types"

/** 10 s cap (as in the source `httpRequest`), applied to reads only. */
const REQUEST_TIMEOUT_MS = 10000

/**
 * Writes (POST) are never cut off: the fetch cannot be aborted once relayed,
 * so a timeout would report a post that actually went through as failed and
 * invite a duplicate retry. Reads keep the cap so a stuck feed does not hang.
 */
function request(
  url: string,
  init: FbFetchInit = {}
): Promise<FbFetchResult | undefined> {
  if ((init.method ?? "GET").toUpperCase() !== "GET") return fbFetch(url, init)
  return Promise.race([
    new Promise<undefined>((resolve) =>
      setTimeout(() => resolve(undefined), REQUEST_TIMEOUT_MS)
    ),
    fbFetch(url, init)
  ])
}

/** EAAB token for graph.facebook.com, cached for the page session. */
let cachedAdsAccessToken = ""

function hideableIdFromStoryCreate(sc: Record<string, unknown>): string {
  if (!sc) return ""
  const story = (sc.story ??
    (sc.story_render as Record<string, unknown> | undefined)?.story ??
    {}) as Record<string, unknown>
  const ids = new Set<string>()
  const add = (v: unknown) => {
    const s = String(v ?? "").trim()
    if (/^\d{10,}$/.test(s)) ids.add(s)
  }
  add(story.legacy_story_hideable_id)
  add(postIdFromStory(story.id as string | undefined))
  add(postIdFromStory(sc.story_id as string | undefined))
  add(sc.post_id)
  // scan all string values for permalink/posts patterns
  const collect = (obj: unknown, depth = 0) => {
    if (depth > 12 || obj == null) return
    if (typeof obj === "string") {
      const m1 = obj.match(/\/groups\/\d+\/permalink\/(\d{10,})/i)
      if (m1) add(m1[1])
      const m2 = obj.match(/\/groups\/\d+\/posts\/(\d{10,})/i)
      if (m2) add(m2[1])
      return
    }
    if (Array.isArray(obj)) {
      obj.forEach((v) => collect(v, depth + 1))
      return
    }
    if (typeof obj === "object") {
      Object.values(obj as Record<string, unknown>).forEach((v) =>
        collect(v, depth + 1)
      )
    }
  }
  collect(sc)
  const storyUrl = String(story.url ?? "")
  const fromUrl = storyUrl.match(/\/permalink\/(\d{10,})/i)
  if (fromUrl) return fromUrl[1]
  if (ids.size) return [...ids].sort((a, b) => b.length - a.length)[0]
  return ""
}

function extractPostUrl(
  data: Record<string, unknown>,
  groupId: string
): string | null {
  const gid = String(groupId ?? "").trim()
  const sc = (data?.data as Record<string, unknown>)?.story_create as
    | Record<string, unknown>
    | undefined
  if (!sc) return null
  const story = (sc?.story ??
    (sc?.story_render as Record<string, unknown>)?.story ??
    {}) as Record<string, unknown>
  const hideable = hideableIdFromStoryCreate(sc)
  if (hideable && gid)
    return `https://www.facebook.com/groups/${gid}/permalink/${hideable}/`
  const storyUrl = String(story.url ?? "").trim()
  if (storyUrl && /\/permalink\//i.test(storyUrl)) return storyUrl
  if (storyUrl && /\/groups\/\d+\/posts\/\d+/i.test(storyUrl) && gid) {
    return storyUrl.replace(
      /\/groups\/\d+\/posts\/(\d+)/,
      `/groups/${gid}/permalink/$1`
    )
  }
  if (sc.post_id && /^\d+$/.test(String(sc.post_id)) && gid) {
    return `https://www.facebook.com/groups/${gid}/permalink/${sc.post_id}/`
  }
  const pid = postIdFromStory((story.id ?? sc?.story_id) as string | undefined)
  if (pid && gid)
    return `https://www.facebook.com/groups/${gid}/permalink/${pid}/`
  if (storyUrl && /^https?:\/\//i.test(storyUrl)) return storyUrl
  return null
}

// ─── buildPostVariables ────────────────────────────────────────────────────────

interface PostAttachment {
  photo?: { id: string }
  video?: {
    id: string
    notify_when_processed: boolean
    audio_descriptions?: null
    additional_video_metadata?: { translatedAudioMetadata: unknown[] }
    transcriptions?: null
    was_created_via_unified_video_flow?: null
  }
}

interface BuildPostVariablesOpts {
  groupId: string
  actorId: string
  content: string
  attachments: PostAttachment[]
  enrich: boolean
  textFormatPresetId: string
  feeling: { objectId: string; verbId: string } | null
  checkinPlaceId: string | null
  isAnonymous: boolean
  statusWithPhotos: boolean
}

function buildPostVariables(
  opts: BuildPostVariablesOpts
): Record<string, unknown> {
  const {
    groupId,
    actorId,
    content,
    attachments,
    enrich,
    textFormatPresetId,
    feeling,
    checkinPlaceId,
    isAnonymous,
    statusWithPhotos
  } = opts
  const isStatusBg = textFormatPresetId !== "0"
  const inlineActivities = feeling
    ? [
        {
          object_attachment_behavior: "SHOWN",
          object_id: feeling.objectId,
          taggable_activity_id: feeling.verbId
        }
      ]
    : []

  const base: Record<string, unknown> = {
    source: "WWW",
    message: { ranges: [], text: content },
    inline_activities: inlineActivities,
    tracking: [null],
    audience: { to_id: groupId },
    actor_id: actorId,
    client_mutation_id: isStatusBg ? "1" : String(Date.now())
  }

  if (isAnonymous)
    base.ask_admin_to_post_for_user = { is_asking_admin_to_post: true }

  if (!isStatusBg) {
    base.attachments = attachments
    base.explicit_place_id = checkinPlaceId || "0"
  } else {
    if (checkinPlaceId) base.explicit_place_id = checkinPlaceId
    if (statusWithPhotos && attachments.length) base.attachments = attachments
  }

  if (checkinPlaceId) base.place_attachment_setting = "HIDE_ATTACHMENT"

  if (!enrich) return { input: base }

  const enriched: Record<string, unknown> = {
    ...base,
    composer_entry_point: "inline_composer",
    composer_source_surface: "group",
    composer_type: "group",
    with_tags_ids: null,
    text_format_preset_id: textFormatPresetId,
    group_flair: { flair_id: null },
    navigation_data: {
      attribution_id_v2: `CometGroupDiscussionRoot.react,comet.group,via_cold_start,${Date.now()},,,,`
    },
    event_share_metadata: { surface: "newsfeed" },
    logging: { composer_session_id: crypto.randomUUID() }
  }

  if (isStatusBg && statusWithPhotos && attachments.length) {
    enriched.attachments = attachments
    enriched.modified_text_features_capabilities = [
      "CONTAINED_LINK",
      "CONTAINED_MEDIA"
    ]
    enriched.best_format_preset_id = String(textFormatPresetId)
  }

  if (!isStatusBg || statusWithPhotos)
    enriched.idempotence_token = crypto.randomUUID()

  return {
    input: enriched,
    feedLocation: "GROUP",
    feedbackSource: 0,
    focusCommentID: null,
    gridMediaWidth: null,
    groupID: null,
    scale: 1,
    privacySelectorRenderLocation: "COMET_STREAM",
    checkPhotosToReelsUpsellEligibility: false,
    referringStoryRenderLocation: null,
    renderLocation: "group",
    useDefaultActor: false,
    inviteShortLinkKey: null,
    isFeed: false,
    isFundraiser: false,
    isFunFactPost: false,
    isGroup: true,
    isEvent: false,
    isTimeline: false,
    isSocialLearning: false,
    isPageNewsFeed: false,
    isProfileReviews: false,
    isWorkSharedDraft: false,
    hashtag: null,
    canUserManageOffers: false
  }
}

// ─── postVideoToGroup ──────────────────────────────────────────────────────────

interface PostVideoParams {
  groupId: string
  content: string
  videoId: string
  photoIds?: string[]
  feeling?: { objectId: string; verbId: string } | null
  anonymousActorId?: string | null
}

async function postVideoToGroup(
  p: PostVideoParams
): Promise<PostToGroupResult> {
  const { uid, fbDtsg, lsd, siteData: sd } = await getSessionTokens()
  const jazoest = generateJazoest(fbDtsg)

  const groupId = String(p.groupId).trim()
  const actorId = p.anonymousActorId ?? uid
  const photoIds = p.photoIds ?? []
  const feeling = p.feeling ?? null
  const composerSessionId = crypto.randomUUID()

  const inlineActivities = feeling
    ? [
        {
          object_attachment_behavior: "SHOWN",
          object_id: feeling.objectId,
          taggable_activity_id: feeling.verbId
        }
      ]
    : []

  const attachments: PostAttachment[] = []
  photoIds.forEach((id) => attachments.push({ photo: { id } }))
  attachments.push({
    video: {
      audio_descriptions: null,
      id: p.videoId,
      additional_video_metadata: { translatedAudioMetadata: [] },
      notify_when_processed: true,
      transcriptions: null,
      was_created_via_unified_video_flow: null
    }
  })

  const textBlocks = p.content ? [p.content] : [""]

  const strategies = [
    {
      doc_id: "26331916023163529",
      friendly_name: "ComposerStoryCreateMutation",
      composer_source_surface: "group",
      composer_type: "group",
      groupID: null as string | null
    },
    {
      doc_id: "202001422281782",
      friendly_name: "comet_ComposerCometDiscussionRoute",
      composer_source_surface: "group_feed",
      composer_type: "feed",
      groupID: groupId
    }
  ]

  let lastError = "Did not receive a successful response from Facebook"

  for (const strat of strategies) {
    const input: Record<string, unknown> = {
      composer_entry_point: "inline_composer",
      composer_source_surface: strat.composer_source_surface,
      composer_type: strat.composer_type,
      logging: { composer_session_id: composerSessionId },
      source: "WWW",
      message: { ranges: [], text: p.content || "" },
      with_tags_ids: null,
      inline_activities: inlineActivities,
      text_format_preset_id: "0",
      group_flair: { flair_id: null },
      attachments,
      composed_text: {
        block_data: textBlocks.map(() => "{}"),
        block_depths: textBlocks.map(() => 0),
        block_types: textBlocks.map(() => 0),
        blocks: textBlocks,
        entities: textBlocks.map(() => "[]"),
        entity_map: "{}",
        inline_styles: textBlocks.map(() => "[]")
      },
      navigation_data: {
        attribution_id_v2: `CometGroupDiscussionRoot.react,comet.group,tap_bookmark,${Date.now()},291459,${groupId},,`
      },
      tracking: [null],
      event_share_metadata: { surface: "newsfeed" },
      audience: { to_id: groupId },
      actor_id: actorId,
      client_mutation_id: "2"
    }
    if (strat.groupID) input.group_id = strat.groupID

    const variables: Record<string, unknown> = {
      input,
      feedLocation: "GROUP",
      feedbackSource: 0,
      focusCommentID: null,
      gridMediaWidth: null,
      groupID: strat.groupID,
      scale: 1,
      privacySelectorRenderLocation: "COMET_STREAM",
      checkPhotosToReelsUpsellEligibility: false,
      referringStoryRenderLocation: null,
      renderLocation: "group",
      useDefaultActor: false,
      inviteShortLinkKey: null,
      isFeed: strat.composer_type === "feed",
      isFundraiser: false,
      isFunFactPost: false,
      isGroup: true,
      isEvent: false,
      isTimeline: false,
      isSocialLearning: false,
      isPageNewsFeed: false,
      isProfileReviews: false,
      isWorkSharedDraft: false,
      hashtag: null,
      canUserManageOffers: false,
      __relay_internal__pv__CometUFIShareActionMigrationrelayprovider: true,
      __relay_internal__pv__GHLShouldChangeSponsoredDataFieldNamerelayprovider:
        true,
      __relay_internal__pv__GHLShouldChangeAdIdFieldNamerelayprovider: true,
      __relay_internal__pv__CometUFI_dedicated_comment_routable_dialog_gkrelayprovider:
        false,
      __relay_internal__pv__CometUFICommentAvatarStickerAnimatedImagerelayprovider:
        false,
      __relay_internal__pv__CometUFICommentActionLinksRewriteEnabledrelayprovider:
        false,
      __relay_internal__pv__IsWorkUserrelayprovider: false,
      __relay_internal__pv__TestPilotShouldIncludeDemoAdUseCaserelayprovider:
        false,
      __relay_internal__pv__FBReels_deprecate_short_form_video_context_gkrelayprovider:
        true,
      __relay_internal__pv__FBReels_enable_view_dubbed_audio_type_gkrelayprovider:
        true,
      __relay_internal__pv__CometImmersivePhotoCanUserDisable3DMotionrelayprovider:
        false,
      __relay_internal__pv__WorkCometIsEmployeeGKProviderrelayprovider: false,
      __relay_internal__pv__CometUFIReactionsEnableShortNamerelayprovider:
        false,
      __relay_internal__pv__CometUFISingleLineUFIrelayprovider: false,
      __relay_internal__pv__IsMergQAPollsrelayprovider: false,
      __relay_internal__pv__FBReelsMediaFooter_comet_enable_reels_ads_gkrelayprovider:
        true,
      __relay_internal__pv__StoriesArmadilloReplyEnabledrelayprovider: true,
      __relay_internal__pv__FBReelsIFUTileContent_reelsIFUPlayOnHoverrelayprovider:
        true,
      __relay_internal__pv__GroupsCometGYSJFeedItemHeightrelayprovider: 206,
      __relay_internal__pv__ShouldEnableBakedInTextStoriesrelayprovider: false,
      __relay_internal__pv__StoriesShouldIncludeFbNotesrelayprovider: true,
      __relay_internal__pv__groups_comet_use_glvrelayprovider: true
    }

    const fd = new URLSearchParams(
      Object.entries({
        av: uid,
        __aaid: String(sd.__aaid ?? "0"),
        __user: uid,
        __a: "1",
        __req: String(sd.__req ?? "1a"),
        __hs: String(sd.__hs ?? ""),
        dpr: String(sd.dpr ?? "1"),
        __ccg: String(sd.__ccg ?? "EXCELLENT"),
        __rev: String(sd.__spin_r ?? sd.client_revision ?? ""),
        __s: String(sd.__s ?? sd._s ?? ""),
        __hsi: String(sd.__hsi ?? sd._hsi ?? ""),
        __dyn: String(sd.__dyn ?? ""),
        __csr: String(sd.__csr ?? ""),
        __comet_req: String(sd.__comet_req ?? "15"),
        __spin_r: String(sd.__spin_r ?? ""),
        __spin_b: String(sd.__spin_b ?? "trunk"),
        __spin_t: String(sd.__spin_t ?? ""),
        __crn: "comet.fbweb.CometGroupDiscussionRoute",
        fb_dtsg: fbDtsg,
        jazoest,
        lsd,
        variables: JSON.stringify(variables),
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: strat.friendly_name,
        server_timestamps: "true",
        doc_id: strat.doc_id
      }).filter(([, v]) => v !== "")
    )

    let rawText: string
    try {
      const res = await request("https://www.facebook.com/api/graphql/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        credentials: "include",
        body: fd.toString()
      })
      rawText = res?.data?.body ?? ""
    } catch {
      lastError = "Connection error while posting the video"
      continue
    }

    let data: Record<string, unknown>
    try {
      data = parseGraphqlResponse(rawText)
    } catch {
      lastError = "Could not parse the response"
      continue
    }

    const topErrors =
      (data?.errors as Array<{ code?: number }> | undefined) ?? []
    if (topErrors.some((e) => e.code === 1357004)) {
      lastError =
        "Facebook session error (1357004) — reload the page and try again"
      continue
    }

    const critErrs = topErrors.filter(
      (e: Record<string, unknown>) =>
        e.severity === "ERROR" || e.severity === "CRITICAL"
    )
    if (critErrs.length) {
      lastError = String(
        (critErrs[0] as Record<string, unknown>).message ?? lastError
      )
      continue
    }

    const sc = (data?.data as Record<string, unknown>)?.story_create as
      | Record<string, unknown>
      | undefined
    if (!sc) {
      lastError = "Did not receive a successful response from Facebook"
      continue
    }

    const postUrl = extractPostUrl(data, groupId)
    if (postUrl) return { success: true, postUrl, note: "" }

    // story_create exists but has no URL yet — video is still processing
    const storyId = String(sc.story_id ?? sc.post_id ?? "")
    return {
      success: true,
      postUrl: storyId
        ? `https://www.facebook.com/groups/${groupId}/permalink/${storyId}/`
        : `https://www.facebook.com/groups/${groupId}/`,
      note: "Facebook is still processing the video; it may take a few minutes to appear."
    }
  }

  throw new Error(lastError)
}

// ─── postToGroup ───────────────────────────────────────────────────────────────

export async function postToGroup(
  p: PostToGroupParams
): Promise<PostToGroupResult> {
  const { uid, fbDtsg, lsd, siteData } = await getSessionTokens()

  if (!uid || !fbDtsg)
    throw new Error(
      "Not logged in to Facebook or token is missing. Reload the page."
    )

  const groupId = String(p.groupId).trim()
  const videoId = p.videoId ?? null

  // Video post dùng flow riêng (doc_id + variables khác)
  if (videoId) {
    return postVideoToGroup({
      groupId,
      content: p.content,
      videoId,
      photoIds: p.photoIds,
      feeling: p.feeling,
      anonymousActorId: p.anonymousActorId
    })
  }

  const actorId = p.anonymousActorId ?? uid
  const photoIds = p.photoIds ?? []
  const textFormatPresetId = p.textFormatPresetId ?? "0"
  const feeling = p.feeling ?? null
  const checkinPlaceId = p.checkinPlaceId ?? null
  const isStatusBg = textFormatPresetId !== "0"
  const statusWithPhotos = !!(isStatusBg && photoIds.length)

  const attachments: PostAttachment[] = []
  photoIds.forEach((id) => attachments.push({ photo: { id } }))

  const hasExtraFeatures =
    isStatusBg ||
    !!feeling ||
    !!checkinPlaceId ||
    !!p.anonymousActorId ||
    statusWithPhotos
  const docIdPlain =
    feeling || checkinPlaceId || p.anonymousActorId || statusWithPhotos
      ? "25940299652331738"
      : isStatusBg
        ? "26196957489933946"
        : "3559434960802556"

  const spinR = String(siteData?.__spin_r ?? siteData?.spin ?? "")
  const spinB = String(siteData?.__spin_b ?? "trunk")
  const spinT = String(siteData?.__spin_t ?? "")

  let lastError = "Did not receive a successful response from Facebook"

  for (let attempt = 0; attempt < 2; attempt++) {
    const enrich = hasExtraFeatures || attempt === 1
    const variables = buildPostVariables({
      groupId,
      actorId,
      content: p.content,
      attachments,
      enrich,
      textFormatPresetId,
      feeling,
      checkinPlaceId,
      isAnonymous: !!p.anonymousActorId,
      statusWithPhotos
    })

    const fd = new URLSearchParams({
      av: uid,
      __aaid: "0",
      __user: uid,
      __a: "1",
      __comet_req: "15",
      fb_dtsg: fbDtsg,
      lsd,
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "ComposerStoryCreateMutation",
      variables: JSON.stringify(variables),
      server_timestamps: "true",
      doc_id: docIdPlain,
      __spin_r: spinR,
      __spin_b: spinB,
      __spin_t: spinT,
      __crn: "comet.fbweb.CometGroupDiscussionRoute"
    })

    let rawText: string
    try {
      const res = await request("https://www.facebook.com/api/graphql/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        credentials: "include",
        body: fd.toString()
      })
      rawText = res?.data?.body ?? ""
    } catch {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1200))
        continue
      }
      throw new Error("Connection error while posting")
    }

    let data: Record<string, unknown>
    try {
      data = parseGraphqlResponse(rawText)
    } catch {
      lastError = "Could not parse the response"
      continue
    }

    const topErrors =
      (data?.errors as Array<{ code?: number }> | undefined) ?? []
    if (topErrors.some((e) => e.code === 1357004)) {
      lastError = "No permission to post in this group (error 1357004)"
      continue
    }

    const postUrl = extractPostUrl(data, groupId)
    if (postUrl) return { success: true, postUrl, note: "" }

    const critErrs = topErrors.filter(
      (e: Record<string, unknown>) =>
        e.severity === "ERROR" || e.severity === "CRITICAL"
    )
    if (critErrs.length) {
      lastError =
        ((critErrs[0] as Record<string, unknown>).message as string) ??
        lastError
      continue
    }

    const sc = (data?.data as Record<string, unknown>)?.story_create
    if (!sc) {
      lastError = "Did not receive a successful response from Facebook"
      continue
    }

    lastError = "Facebook did not return a post link"
    continue
  }

  throw new Error(lastError)
}

// ─── reactPost ─────────────────────────────────────────────────────────────────

const UFI_REACTION_IDS: Record<string, string> = {
  LIKE: "1678524932434102",
  LOVE: "478547185650144"
}

export async function reactPost(
  postId: string,
  groupId: string
): Promise<void> {
  const { uid, fbDtsg, lsd, siteData } = await getSessionTokens()
  if (!uid || !fbDtsg) return

  const plainPostId = (() => {
    const p = String(postId).trim()
    if (p.includes("_")) {
      const tail = p.split("_").pop()
      if (tail && /^\d+$/.test(tail)) return tail
    }
    return p
  })()
  if (!plainPostId) return

  const gidStr = String(groupId ?? "").trim()
  const feedbackId = btoa(
    "feedback:" + (gidStr ? `${gidStr}_${plainPostId}` : plainPostId)
  )
  const rid = UFI_REACTION_IDS.LIKE

  const attrTail = String(Math.floor(Math.random() * 900000) + 100000)
  const attribution = gidStr
    ? `CometGroupDiscussionRoot.react,comet.group,unexpected,${Date.now()},${attrTail},${gidStr},,,`
    : `CometSinglePostDialogRoot.react,comet.post.single_dialog,via_cold_start,${Date.now()},${attrTail},,,`

  const input = {
    attribution_id_v2: attribution,
    feedback_id: feedbackId,
    feedback_reaction_id: rid,
    feedback_source: "OBJECT",
    feedback_referrer: gidStr
      ? `/groups/${gidStr}/posts/${plainPostId}`
      : "/profile.php",
    is_tracking_encrypted: false,
    tracking: [],
    session_id: crypto.randomUUID(),
    actor_id: uid,
    client_mutation_id: "1"
  }

  const variables = {
    input,
    useDefaultActor: false,
    __relay_internal__pv__CometUFIReactionsEnableShortNamerelayprovider: false
  }

  const spinR = String(siteData?.__spin_r ?? "")
  const spinB = String(siteData?.__spin_b ?? "trunk")
  const spinT = String(siteData?.__spin_t ?? "")

  const params = new URLSearchParams({
    av: uid,
    __aaid: "0",
    __user: uid,
    __a: "1",
    __comet_req: "15",
    fb_dtsg: fbDtsg,
    lsd,
    fb_api_caller_class: "RelayModern",
    fb_api_req_friendly_name: "CometUFIFeedbackReactMutation",
    variables: JSON.stringify(variables),
    server_timestamps: "true",
    doc_id: "34430477113234631",
    __spin_r: spinR,
    __spin_b: spinB,
    __spin_t: spinT,
    __crn: gidStr
      ? "comet.fbweb.CometGroupDiscussionRoute"
      : "comet.fbweb.CometSinglePostDialogRoute"
  })

  try {
    await request("https://www.facebook.com/api/graphql/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      credentials: "include",
      body: params.toString()
    })
  } catch {
    /* non-fatal */
  }
}

// ─── commentOnPost ─────────────────────────────────────────────────────────────

function ufiFeedbackSuffixes(postId: string, groupId: string): string[] {
  const p = String(postId).trim()
  const gid = String(groupId).trim()
  const out: string[] = []
  const segs = p.split("_")
  if (segs.length >= 2) {
    const tail = segs[segs.length - 1]
    if (/^\d+$/.test(tail) && !out.includes(tail)) out.push(tail)
  }
  if (!out.includes(p)) out.push(p)
  if (gid && /^\d+$/.test(gid) && /^\d+$/.test(p)) {
    const compound = `${gid}_${p}`
    if (!out.includes(compound)) out.push(compound)
  }
  return out
}

function parseAllDataObjects(text: string): Record<string, unknown>[] {
  let cleaned = text
  if (cleaned.startsWith("for (;;);")) cleaned = cleaned.substring(9)
  try {
    const single = JSON.parse(cleaned)
    if (single && typeof single === "object")
      return [single as Record<string, unknown>]
  } catch {
    /* multi-line */
  }
  const results: Record<string, unknown>[] = []
  for (const line of cleaned.split("\n")) {
    const t = line.trim()
    if (!t || !t.startsWith("{")) continue
    try {
      results.push(JSON.parse(t))
    } catch {
      /* skip */
    }
  }
  return results
}

function hasCommentCreate(val: unknown, depth = 0): boolean {
  if (depth > 18 || val == null || typeof val !== "object") return false
  const obj = val as Record<string, unknown>
  if (
    Object.prototype.hasOwnProperty.call(obj, "comment_create") &&
    obj.comment_create != null
  )
    return true
  for (const v of Object.values(obj)) {
    if (hasCommentCreate(v, depth + 1)) return true
  }
  return false
}

export async function commentOnPost(
  postId: string,
  groupId: string,
  text: string,
  photoId: string | null,
  pageId?: string | null
): Promise<void> {
  if (!text.trim()) return

  const rawId = String(postId).trim()
  if (!rawId) throw new Error("Missing postId")
  const gid = String(groupId ?? "").trim()
  const pid = String(pageId ?? "").trim() // page graph ID if commenting as a Fanpage
  const isPage = !!pid

  const { uid, fbDtsg: dtsg, lsd, siteData } = await getSessionTokens()
  if (!dtsg || !uid)
    throw new Error("Not logged in to Facebook (missing fb_dtsg/uid)")

  // Page: av=pageId, __user=profileUid; Profile: av=uid, __user=uid
  const av = isPage ? pid : uid
  const gqlUser = uid // always use profile uid for __user (fb_dtsg is tied to the profile)
  const actorId = isPage ? pid : uid

  const suffixes = ufiFeedbackSuffixes(rawId, gid)
  if (!suffixes.length) throw new Error("Missing postId")

  const attachments = photoId ? [{ media: { id: photoId } }] : []
  const jazoest = generateJazoest(dtsg)
  let lastMsg = "Comment failed"

  for (const suffix of suffixes) {
    const feedbackId = btoa("feedback:" + suffix)
    const attrTail = String(Math.floor(Math.random() * 900000) + 100000)
    const groupAttribution = `CometGroupDiscussionRoot.react,comet.group,unexpected,${Date.now()},${attrTail},${gid},,,`

    const input = {
      actor_id: actorId,
      client_mutation_id: "1",
      attachments,
      feedback_id: feedbackId,
      formatting_style: null,
      message: { ranges: [], text: text },
      vod_video_timestamp: null,
      is_tracking_encrypted: false,
      tracking: [],
      idempotence_token: `client:${crypto.randomUUID()}`,
      session_id: crypto.randomUUID(),
      attribution_id_v2: groupAttribution,
      feedback_referrer: "/",
      feedback_source: "PROFILE"
    }

    const variables = {
      feedLocation: "GROUP",
      feedbackSource: 0,
      groupID: gid || null,
      input,
      inviteShortLinkKey: null,
      renderLocation: null,
      scale: 1,
      useDefaultActor: false,
      focusCommentID: null,
      __relay_internal__pv__groups_comet_use_glvrelayprovider: false,
      __relay_internal__pv__CometUFICommentActionLinksRewriteEnabledrelayprovider:
        false,
      __relay_internal__pv__CometUFICommentAvatarStickerAnimatedImagerelayprovider:
        false,
      __relay_internal__pv__IsWorkUserrelayprovider: false,
      __relay_internal__pv__CometUFICommentAutoTranslationTyperelayprovider:
        "ORIGINAL"
    }

    const params = new URLSearchParams({
      av,
      __aaid: "0",
      __user: gqlUser,
      __a: "1",
      __dyn: "",
      __csr: "",
      __comet_req: "15",
      fb_dtsg: dtsg,
      jazoest,
      lsd: lsd ?? "",
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "useCometUFICreateCommentMutation",
      variables: JSON.stringify(variables),
      server_timestamps: "true",
      doc_id: "26225722187077813",
      __spin_r: String(siteData?.__spin_r ?? ""),
      __spin_b: String(siteData?.__spin_b ?? "trunk"),
      __spin_t: String(siteData?.__spin_t ?? ""),
      __crn: "comet.fbweb.CometGroupDiscussionRoute"
    })

    const raw = await request("https://www.facebook.com/api/graphql/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        ...(lsd ? { "x-fb-lsd": lsd } : {})
      },
      credentials: "include",
      body: params.toString(),
      // Set i_user cookie trong background để Facebook nhận đúng Page context
      ...(isPage ? { iUser: pid } : {})
    })
    const rawText: string = raw?.data?.body ?? ""
    if (!rawText) {
      lastMsg = "Did not receive a response"
      continue
    }

    const allObjs = parseAllDataObjects(rawText)

    // Check for a CRITICAL error
    let critMsg = ""
    for (const obj of allObjs) {
      const errs = (obj as Record<string, unknown>)?.errors
      if (Array.isArray(errs)) {
        for (const e of errs as Record<string, unknown>[]) {
          if (e.severity === "ERROR" || e.severity === "CRITICAL") {
            critMsg = String(e.message || e.summary || "")
            break
          }
        }
      }
      if (critMsg) break
    }
    if (critMsg) {
      lastMsg = critMsg
      continue
    }

    // Check for a successful comment_create
    if (allObjs.some((o) => hasCommentCreate(o))) return
  }

  throw new Error(lastMsg)
}

// ─── uploadImages ──────────────────────────────────────────────────────────────

export async function uploadImages(
  files: { dataUrl: string; name: string }[],
  pageId?: string | null
): Promise<string[]> {
  if (!files.length) return []
  const { uid, fbDtsg } = await getSessionTokens()
  if (!uid || !fbDtsg) return []

  // Khi upload cho Fanpage: av=pageId, profile_id=pageId
  const pid = String(pageId ?? "").trim()
  const av = pid || uid
  const profileId = pid || uid

  const qs = new URLSearchParams({
    av,
    __aaid: "0",
    __user: uid,
    __a: "1",
    fb_dtsg: fbDtsg
  })
  const uploadUrl = `https://www.facebook.com/ajax/react_composer/attachments/photo/upload/?${qs}`

  const formFields: Record<string, string> = {
    fb_dtsg: fbDtsg,
    profile_id: profileId,
    source: "8",
    waterfallxapp: "comet",
    upload_id: "jsc_c_" + Math.floor(Math.random() * 20)
  }

  const photoIds: string[] = []
  for (const f of files) {
    try {
      const res = await sendBgAction<{
        ok: boolean
        status: number
        body: string
      }>("INBOX_UPLOAD_MEDIA", {
        url: uploadUrl,
        formFields,
        filesBase64: [
          {
            fieldName: "farr",
            name: f.name,
            type: f.dataUrl.match(/^data:([^;]+)/)?.[1] ?? "image/jpeg",
            data: f.dataUrl
          }
        ],
        ...(pid ? { iUser: pid } : {})
      })
      if (!res.ok || !res.data?.body) continue
      const text = res.data.body
      const cleaned = text.startsWith("for (;;);") ? text.substring(9) : text
      try {
        const parsed = JSON.parse(cleaned)
        const id = parsed?.payload?.photoID ?? parsed?.payload?.photoId
        if (id) {
          photoIds.push(String(id))
          continue
        }
      } catch {
        /* regex fallback */
      }
      const m = text.match(/"photo[Ii][Dd]"\s*:\s*"(\d+)"/)
      if (m) photoIds.push(m[1])
    } catch {
      /* skip failed image */
    }
  }
  return photoIds
}

// ─── uploadVideo ───────────────────────────────────────────────────────────────

function randomHex32(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => ("0" + b.toString(16)).slice(-2)).join("")
}

function generateJazoest(dtsg: string): string {
  let sum = 0
  for (let i = 0; i < dtsg.length; i++) sum += dtsg.charCodeAt(i)
  return "2" + sum
}

function buildCommonQuery(
  uid: string,
  fbDtsg: string,
  lsd: string,
  siteData: Record<string, unknown> | null,
  extra: Record<string, string> = {}
): string {
  const sd = siteData ?? {}
  const jazoest = generateJazoest(fbDtsg)
  const params: Record<string, string> = {
    __aaid: String(sd.__aaid ?? "0"),
    __user: uid,
    __a: "1",
    __req: String(sd.__req ?? "1d"),
    __hs: String(sd.__hs ?? ""),
    dpr: String(sd.dpr ?? "1"),
    __ccg: String(sd.__ccg ?? "EXCELLENT"),
    __rev: String(sd.__spin_r ?? sd.client_revision ?? ""),
    __s: String(sd.__s ?? sd._s ?? ""),
    __hsi: String(sd.__hsi ?? sd._hsi ?? ""),
    __dyn: String(sd.__dyn ?? ""),
    __csr: String(sd.__csr ?? ""),
    __hsdp: String(sd.__hsdp ?? ""),
    __hblp: String(sd.__hblp ?? ""),
    __sjsp: String(sd.__sjsp ?? ""),
    __comet_req: String(sd.__comet_req ?? "15"),
    __crn: "comet.fbweb.CometGroupDiscussionRoute",
    fb_dtsg: fbDtsg,
    jazoest,
    lsd,
    __spin_r: String(sd.__spin_r ?? ""),
    __spin_b: String(sd.__spin_b ?? "trunk"),
    __spin_t: String(sd.__spin_t ?? ""),
    ...extra
  }
  return new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== "")
  ).toString()
}

export async function uploadVideo(
  file: { dataUrl: string; name: string },
  groupId: string
): Promise<string | null> {
  const { uid, fbDtsg, lsd, siteData } = await getSessionTokens()
  if (!uid || !fbDtsg) return null

  const waterfallId = crypto.randomUUID()
  const composerSessionId = waterfallId
  const targetId = groupId || uid

  // Tính fileSize chính xác từ base64 (trừ padding '=')
  const base64Part = file.dataUrl.includes(",")
    ? file.dataUrl.split(",")[1]
    : file.dataUrl
  const padding = (base64Part.match(/=+$/) ?? [""])[0].length
  const fileSize = Math.floor((base64Part.length * 3) / 4) - padding
  const ext = (file.name.split(".").pop() ?? "mp4").toLowerCase()

  // ── Step 1: initSession ──────────────────────────────────────────────────
  const sd = siteData ?? {}
  const jazoest = generateJazoest(fbDtsg)
  const initBody = new URLSearchParams(
    Object.entries({
      file_size: String(fileSize),
      file_extension: ext,
      target_id: targetId,
      source: "composer",
      composer_dialog_version: "",
      waterfall_id: waterfallId,
      composer_session_id: composerSessionId,
      composer_entry_point_ref: "group",
      composer_work_shared_draft_mode: "",
      has_file_been_replaced: "false",
      supports_chunking: "true",
      supports_file_api: "true",
      partition_start_offset: "0",
      partition_end_offset: String(fileSize),
      creator_product: "2",
      spherical: "false",
      video_publisher_action_source: "",
      __user: uid,
      __a: "1",
      __aaid: String(sd.__aaid ?? "0"),
      __dyn: String(sd.__dyn ?? ""),
      __csr: String(sd.__csr ?? ""),
      __req: String(sd.__req ?? "1q"),
      __hs: String(sd.__hs ?? ""),
      dpr: String(sd.dpr ?? "1"),
      __ccg: String(sd.__ccg ?? "EXCELLENT"),
      __rev: String(sd.__spin_r ?? sd.client_revision ?? ""),
      __s: String(sd.__s ?? sd._s ?? ""),
      __hsi: String(sd.__hsi ?? sd._hsi ?? ""),
      __comet_req: String(sd.__comet_req ?? "15"),
      __crn: "comet.fbweb.CometGroupDiscussionRoute",
      fb_dtsg: fbDtsg,
      jazoest,
      lsd,
      __spin_r: String(sd.__spin_r ?? ""),
      __spin_b: String(sd.__spin_b ?? "trunk"),
      __spin_t: String(sd.__spin_t ?? "")
    }).filter(([, v]) => v !== "")
  )

  const initRes = await request(
    "https://vupload-edge.facebook.com/ajax/video/upload/requests/start/?__a=1",
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        X_FB_VIDEO_WATERFALL_ID: waterfallId
      },
      body: initBody.toString()
    }
  )
  const initText: string = initRes?.data?.body ?? ""
  const initJson = parseJsonResponse(initText)
  const initPayload = (initJson?.payload ?? {}) as Record<string, unknown>
  const videoId = String(initPayload.video_id ?? extractVideoId(initText) ?? "")
  const uploadSessionId = String(initPayload.upload_session_id ?? "")
  const uploadDomain = String(initPayload.upload_domain ?? "")
  if (!videoId) throw new Error("initSession: missing video_id")

  // ── Step 2: ruploadChunk (binary) qua UPLOAD_VIDEO_CHUNK action ──────────
  const hosts = [
    uploadDomain,
    "rupload-hkg1-1.up.facebook.com",
    "rupload.facebook.com"
  ]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
  const pathHash = randomHex32()
  const chunkQuery = buildCommonQuery(uid, fbDtsg, lsd, siteData)
  const chunkUrl = `https://${hosts[0]}/fb_video/${pathHash}-0-${fileSize}?${chunkQuery}`
  const chunkHeaders: Record<string, string> = {
    "x-entity-name": "undefined",
    "x-entity-type": "application/octet-stream",
    "x-entity-length": String(fileSize),
    offset: "0",
    start_offset: "0",
    end_offset: String(fileSize),
    id: uploadSessionId,
    product_media_id: videoId,
    composer_session_id: composerSessionId
  }

  let chunkToken: string | null = null
  for (const host of hosts) {
    const url = `https://${host}/fb_video/${pathHash}-0-${fileSize}?${chunkQuery}`
    const res = await sendBgAction<{
      ok: boolean
      status: number
      body: string
    }>("UPLOAD_VIDEO_CHUNK", {
      url,
      chunkBase64: file.dataUrl,
      headers: chunkHeaders
    })
    if (res.ok && res.data?.body) {
      const t = res.data.body
      const p = parseJsonResponse(t)
      if (typeof p.h === "string") {
        chunkToken = p.h
        break
      }
      const payload = (p?.payload ?? {}) as Record<string, unknown>
      const tok = payload.h ?? payload.fbuploader_video_file_chunk
      if (typeof tok === "string") {
        chunkToken = tok
        break
      }
      const m = t.match(/"h"\s*:\s*"([^"]+)"/)
      if (m) {
        chunkToken = m[1]
        break
      }
      const raw = t.trim()
      if (/^\d:[A-Za-z0-9+/=._:-]+$/.test(raw)) {
        chunkToken = raw
        break
      }
    }
    if (chunkToken) break
  }
  void chunkUrl
  if (!chunkToken)
    throw new Error("ruploadChunk: could not read the chunk token")

  // ── Step 3: receiveChunkToken ────────────────────────────────────────────
  const receiveQuery = buildCommonQuery(uid, fbDtsg, lsd, siteData, {
    composer_session_id: composerSessionId,
    video_id: videoId,
    start_offset: "0",
    end_offset: String(fileSize),
    source: "composer",
    target_id: targetId,
    waterfall_id: waterfallId,
    composer_entry_point_ref: "group",
    has_file_been_replaced: "false",
    supports_chunking: "true",
    partition_start_offset: "0",
    partition_end_offset: String(fileSize),
    lsd
  })

  const receiveRes = await sendBgAction<{
    ok: boolean
    status: number
    body: string
  }>("INBOX_UPLOAD_MEDIA", {
    url: `https://vupload-edge.facebook.com/ajax/video/upload/requests/receive/?${receiveQuery}`,
    formFields: { fbuploader_video_file_chunk: chunkToken },
    filesBase64: [],
    headers: { x_fb_video_waterfall_id: waterfallId }
  })
  if (!receiveRes.ok) throw new Error("receiveChunkToken: extension error")
  const recText = receiveRes.data?.body ?? ""
  const recJson = parseJsonResponse(recText)
  const recPayload = (recJson?.payload ?? {}) as Record<string, unknown>
  if (
    recPayload.error ||
    (recPayload.errorCode !== undefined && Number(recPayload.errorCode) !== 0)
  ) {
    throw new Error(
      String(
        recPayload.errorMessage ??
          recPayload.error ??
          "Facebook rejected the video"
      )
    )
  }

  return videoId
}

// ─── previewShareLink + postShareLinkToGroup ────────────────────────────────────

export async function previewShareLink(
  url: string
): Promise<ShareLinkPreview | null> {
  const { uid, fbDtsg, lsd, siteData: sd } = await getSessionTokens()
  const jazoest = generateJazoest(fbDtsg)
  if (!uid || !fbDtsg) return null

  const docIds = ["27900931222828943", "26582833794643228"]
  const variables = {
    feedLocation: "FEED_COMPOSER",
    goodwillCampaignId: "",
    goodwillCampaignMediaIds: [],
    goodwillContentType: null,
    params: { url: String(url).trim() },
    privacySelectorRenderLocation: "COMET_STREAM",
    referringStoryRenderLocation: null,
    renderLocation: "composer_preview",
    parentStoryID: null,
    scale: 1,
    useDefaultActor: false,
    shouldIncludeStoryAttachment: false,
    __relay_internal__pv__GHLShouldChangeSponsoredDataFieldNamerelayprovider:
      true,
    __relay_internal__pv__TestPilotShouldIncludeDemoAdUseCaserelayprovider:
      false,
    __relay_internal__pv__CometUFICommentActionLinksRewriteEnabledrelayprovider:
      false,
    __relay_internal__pv__CometUFICommentAvatarStickerAnimatedImagerelayprovider:
      false,
    __relay_internal__pv__IsWorkUserrelayprovider: false,
    __relay_internal__pv__FBReels_enable_view_dubbed_audio_type_gkrelayprovider:
      true,
    __relay_internal__pv__CometFeedShareMedia_shouldPrefetchShareImagerelayprovider:
      false,
    __relay_internal__pv__CometImmersivePhotoCanUserDisable3DMotionrelayprovider:
      false,
    __relay_internal__pv__WorkCometIsEmployeeGKProviderrelayprovider: false,
    __relay_internal__pv__IsMergQAPollsrelayprovider: false,
    __relay_internal__pv__FBReels_deprecate_short_form_video_context_gkrelayprovider:
      true,
    __relay_internal__pv__FBReelsMediaFooter_comet_enable_reels_ads_gkrelayprovider:
      true
  }

  for (const docId of docIds) {
    const fd = new URLSearchParams(
      Object.entries({
        av: uid,
        __user: uid,
        __a: "1",
        __req: String(sd.__req ?? "1a"),
        __hs: String(sd.__hs ?? ""),
        dpr: String(sd.dpr ?? "1"),
        __ccg: String(sd.__ccg ?? "EXCELLENT"),
        __rev: String(sd.__spin_r ?? ""),
        __s: String(sd.__s ?? sd._s ?? ""),
        __hsi: String(sd.__hsi ?? sd._hsi ?? ""),
        __dyn: String(sd.__dyn ?? ""),
        __csr: String(sd.__csr ?? ""),
        __comet_req: String(sd.__comet_req ?? "15"),
        __spin_r: String(sd.__spin_r ?? ""),
        __spin_b: String(sd.__spin_b ?? "trunk"),
        __spin_t: String(sd.__spin_t ?? ""),
        __crn: "comet.fbweb.CometGroupDiscussionRoute",
        fb_dtsg: fbDtsg,
        jazoest,
        lsd,
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: "ComposerLinkAttachmentPreviewQuery",
        variables: JSON.stringify(variables),
        server_timestamps: "true",
        doc_id: docId
      }).filter(([, v]) => v !== "")
    )

    try {
      const res = await request("https://www.facebook.com/api/graphql/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        credentials: "include",
        body: fd.toString()
      })
      const rawText: string = res?.data?.body ?? ""
      let data: Record<string, unknown>
      try {
        data = parseGraphqlResponse(rawText)
      } catch {
        continue
      }
      const lp = (data?.data as Record<string, unknown> | undefined)
        ?.link_preview as Record<string, unknown> | undefined
      const scrape = lp?.share_scrape_data
      if (!scrape) continue
      const scrapeStr =
        typeof scrape === "string" ? scrape : JSON.stringify(scrape)
      // Validate: phải có share_type và share_params
      try {
        const o = JSON.parse(scrapeStr) as Record<string, unknown>
        if (
          o.share_type == null ||
          !Array.isArray(o.share_params) ||
          !(o.share_params as unknown[]).length
        )
          continue
        if (o.share_type === 400 || o.share_type === "400") continue
      } catch {
        continue
      }

      // Extract title/description/image từ story object (share_scrape_data chỉ chứa ID opaque)
      let title = ""
      let description = ""
      let imageUrl = ""
      try {
        const story = lp?.story as Record<string, unknown> | undefined
        const cometSections = story?.comet_sections as
          | Record<string, unknown>
          | undefined

        // Title từ message_container hoặc attached_story_layout
        const msgContainer = cometSections?.message_container as
          | Record<string, unknown>
          | undefined
        const msgStory = msgContainer?.story as
          | Record<string, unknown>
          | undefined
        const message = msgStory?.message as Record<string, unknown> | undefined
        const msgText = message?.text as string | undefined
        if (msgText) title = msgText.split("\n")[0].slice(0, 200)

        // Fallback: title từ attached_story_layout > story > comet_sections > message_container
        if (!title) {
          const attachedLayout = cometSections?.attached_story_layout as
            | Record<string, unknown>
            | undefined
          const attachedStory = attachedLayout?.story as
            | Record<string, unknown>
            | undefined
          const attachedSections = attachedStory?.comet_sections as
            | Record<string, unknown>
            | undefined
          const attachedMsg = (
            attachedSections?.message_container as
              | Record<string, unknown>
              | undefined
          )?.story as Record<string, unknown> | undefined
          const attachedText = (
            attachedMsg?.message as Record<string, unknown> | undefined
          )?.text as string | undefined
          if (attachedText) title = attachedText.split("\n")[0].slice(0, 200)

          // Fallback: title từ actors name + ghl_mocked_footer_info.headline
          if (!title) {
            const titleSection = attachedSections?.title as
              | Record<string, unknown>
              | undefined
            const titleStory = titleSection?.story as
              | Record<string, unknown>
              | undefined
            const actors = titleStory?.actors as
              | Array<Record<string, unknown>>
              | undefined
            const actorName = actors?.[0]?.name as string | undefined
            const ghlFooter = attachedStory?.ghl_mocked_footer_info as
              | Record<string, unknown>
              | undefined
            const headline = ghlFooter?.headline as string | undefined
            if (headline) title = headline
            else if (actorName) title = actorName
          }

          // Description từ các UNSTYLED text blocks sau title
          if (attachedText) {
            const lines = attachedText.split("\n").filter(Boolean)
            if (lines.length > 1)
              description = lines.slice(1, 4).join(" ").slice(0, 300)
          }

          // Image từ attachments[0].styles.attachment.media.photo_image.uri
          const attachments = attachedStory?.attachments as
            | Array<Record<string, unknown>>
            | undefined
          const firstAttach = attachments?.[0]
          const attachMedia = (
            (firstAttach?.styles as Record<string, unknown> | undefined)
              ?.attachment as Record<string, unknown> | undefined
          )?.media as Record<string, unknown> | undefined
          const photoImage = attachMedia?.photo_image as
            | Record<string, unknown>
            | undefined
          const uri = photoImage?.uri as string | undefined
          if (uri) imageUrl = uri

          // Fallback: image từ story level
          if (!imageUrl) {
            const storyAttachments = story?.attachments as
              | Array<Record<string, unknown>>
              | undefined
            const storyMedia = (
              (
                storyAttachments?.[0]?.styles as
                  | Record<string, unknown>
                  | undefined
              )?.attachment as Record<string, unknown> | undefined
            )?.media as Record<string, unknown> | undefined
            const storyPhoto = storyMedia?.photo_image as
              | Record<string, unknown>
              | undefined
            if (storyPhoto?.uri) imageUrl = storyPhoto.uri as string
          }
        }
      } catch {
        /* leave title/description/imageUrl as empty string */
      }

      return { shareScrapeData: scrapeStr, title, description, imageUrl }
    } catch {
      continue
    }
  }
  return null
}

export async function postShareLinkToGroup(params: {
  groupId: string
  content: string
  shareLinkUrl: string
  shareScrapeData?: string | null
  anonymousActorId?: string | null
  /** Share as this Page (uses the `i_user` relay); omitted = the profile */
  pageId?: string | null
}): Promise<PostToGroupResult> {
  const { uid, fbDtsg, lsd, siteData: sd } = await getSessionTokens()
  const jazoest = generateJazoest(fbDtsg)
  if (!uid || !fbDtsg)
    throw new Error("Not logged in to Facebook or token is missing.")

  const groupId = String(params.groupId).trim()
  const pageId = params.pageId && params.pageId !== uid ? params.pageId : null
  const actorId = params.anonymousActorId ?? pageId ?? uid

  // Lấy share_scrape_data — dùng cached hoặc fetch mới
  let scrapeStr = params.shareScrapeData ?? null
  if (!scrapeStr) {
    const preview = await previewShareLink(params.shareLinkUrl)
    if (!preview)
      throw new Error("Could not get link preview data. Try reloading.")
    scrapeStr = preview.shareScrapeData
  }

  const ts = Date.now()
  const n1 = String(Math.floor(Math.random() * 900000) + 100000)
  const n2 = String(Math.floor(Math.random() * 900000) + 100000)
  const ts2 = ts - (Math.floor(Math.random() * 2500000) + 500000)

  const variables = {
    input: {
      composer_entry_point: "inline_composer",
      composer_source_surface: "group",
      composer_type: "group",
      logging: { composer_session_id: crypto.randomUUID() },
      source: "WWW",
      message: { ranges: [], text: params.content || "" },
      with_tags_ids: null,
      inline_activities: [],
      text_format_preset_id: "0",
      group_flair: { flair_id: null },
      attachments: [
        {
          link: {
            link_call_to_action_type: null,
            link_preview_photo_id: null,
            share_scrape_data: scrapeStr
          }
        }
      ],
      composed_text: (() => {
        const blocks = params.content ? [params.content] : [""]
        return {
          block_data: blocks.map(() => "{}"),
          block_depths: blocks.map(() => 0),
          block_types: blocks.map(() => 0),
          blocks,
          entities: blocks.map(() => "[]"),
          entity_map: "{}",
          inline_styles: blocks.map(() => "[]")
        }
      })(),
      navigation_data: {
        attribution_id_v2: [
          `CometGroupDiscussionRoot.react,comet.group,unexpected,${ts},${n1},${groupId},,,`,
          `GroupsCometCrossGroupFeedRoot.react,comet.groups.feed,tap_bookmark,${ts2},${n2},${groupId},,,`
        ].join(";")
      },
      tracking: [null],
      event_share_metadata: { surface: "newsfeed" },
      audience: { to_id: groupId },
      actor_id: actorId,
      ...(params.anonymousActorId
        ? { ask_admin_to_post_for_user: { is_asking_admin_to_post: true } }
        : {}),
      client_mutation_id: "2"
    },
    feedLocation: "GROUP",
    feedbackSource: 0,
    focusCommentID: null,
    gridMediaWidth: null,
    groupID: null,
    scale: 1,
    privacySelectorRenderLocation: "COMET_STREAM",
    checkPhotosToReelsUpsellEligibility: false,
    referringStoryRenderLocation: null,
    renderLocation: "group",
    useDefaultActor: false,
    inviteShortLinkKey: null,
    isFeed: false,
    isFundraiser: false,
    isFunFactPost: false,
    isGroup: true,
    isEvent: false,
    isTimeline: false,
    isSocialLearning: false,
    isPageNewsFeed: false,
    isProfileReviews: false,
    isWorkSharedDraft: false,
    hashtag: null,
    canUserManageOffers: false,
    __relay_internal__pv__CometFeedShareMedia_shouldPrefetchShareImagerelayprovider:
      false,
    __relay_internal__pv__CometFeedStory_enable_post_permalink_white_space_clickrelayprovider:
      false,
    __relay_internal__pv__CometFeedStory_enable_reactor_facepilerelayprovider:
      false,
    __relay_internal__pv__CometImmersivePhotoCanUserDisable3DMotionrelayprovider:
      false,
    __relay_internal__pv__CometUFICommentActionLinksRewriteEnabledrelayprovider:
      false,
    __relay_internal__pv__CometUFICommentAutoTranslationTyperelayprovider:
      "AUTO_TRANSLATE",
    __relay_internal__pv__CometUFICommentAvatarStickerAnimatedImagerelayprovider:
      false,
    __relay_internal__pv__CometUFIReactionsEnableShortNamerelayprovider: false,
    __relay_internal__pv__CometUFIShareActionMigrationrelayprovider: true,
    __relay_internal__pv__CometUFISingleLineUFIrelayprovider: true,
    __relay_internal__pv__CometUFI_dedicated_comment_routable_dialog_gkrelayprovider:
      true,
    __relay_internal__pv__FBReelsIFUTileContent_reelsIFUPlayOnHoverrelayprovider:
      true,
    __relay_internal__pv__FBReelsMediaFooter_comet_enable_reels_ads_gkrelayprovider:
      true,
    __relay_internal__pv__FBReels_deprecate_short_form_video_context_gkrelayprovider:
      true,
    __relay_internal__pv__FBReels_enable_view_dubbed_audio_type_gkrelayprovider:
      true,
    __relay_internal__pv__GHLShouldChangeAdIdFieldNamerelayprovider: true,
    __relay_internal__pv__GHLShouldChangeSponsoredAuctionDistanceFieldNamerelayprovider:
      false,
    __relay_internal__pv__GHLShouldChangeSponsoredDataFieldNamerelayprovider:
      true,
    __relay_internal__pv__GHLShouldUseSponsoredAuctionLabelFieldNameV1relayprovider:
      false,
    __relay_internal__pv__GHLShouldUseSponsoredAuctionLabelFieldNameV2relayprovider:
      false,
    __relay_internal__pv__GroupsCometGYSJFeedItemHeightrelayprovider: 206,
    __relay_internal__pv__IsMergQAPollsrelayprovider: false,
    __relay_internal__pv__IsWorkUserrelayprovider: false,
    __relay_internal__pv__ReelsIFUCard_reelsIFULikeCountrelayprovider: false,
    __relay_internal__pv__ShouldEnableBakedInTextStoriesrelayprovider: false,
    __relay_internal__pv__StoriesShouldIncludeFbNotesrelayprovider: true,
    __relay_internal__pv__TestPilotShouldIncludeDemoAdUseCaserelayprovider:
      false,
    __relay_internal__pv__WorkCometIsEmployeeGKProviderrelayprovider: false,
    __relay_internal__pv__groups_comet_use_glvrelayprovider: false,
    __relay_internal__pv__relay_provider_comet_ufi_ssr_seo_deferrelayprovider:
      true
  }

  const fd = new URLSearchParams(
    Object.entries({
      av: pageId ?? uid,
      __aaid: String(sd.__aaid ?? "0"),
      __user: uid,
      __a: "1",
      __req: String(sd.__req ?? "1a"),
      __hs: String(sd.__hs ?? ""),
      dpr: String(sd.dpr ?? "1"),
      __ccg: String(sd.__ccg ?? "EXCELLENT"),
      __rev: String(sd.__spin_r ?? ""),
      __s: String(sd.__s ?? sd._s ?? ""),
      __hsi: String(sd.__hsi ?? sd._hsi ?? ""),
      __dyn: String(sd.__dyn ?? ""),
      __csr: String(sd.__csr ?? ""),
      __comet_req: String(sd.__comet_req ?? "15"),
      __spin_r: String(sd.__spin_r ?? ""),
      __spin_b: String(sd.__spin_b ?? "trunk"),
      __spin_t: String(sd.__spin_t ?? ""),
      __crn: "comet.fbweb.CometGroupDiscussionRoute",
      fb_dtsg: fbDtsg,
      jazoest,
      lsd,
      variables: JSON.stringify(variables),
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "ComposerStoryCreateMutation",
      server_timestamps: "true",
      doc_id: "27043104642009435"
    }).filter(([, v]) => v !== "")
  )

  let lastError = "Could not post the link to the group"
  for (let attempt = 0; attempt < 2; attempt++) {
    let rawText: string
    try {
      const res = await request("https://www.facebook.com/api/graphql/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        credentials: "include",
        body: fd.toString(),
        ...(pageId ? { iUser: pageId } : {})
      })
      rawText = res?.data?.body ?? ""
    } catch {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1200))
        continue
      }
      throw new Error("Connection error while posting the link")
    }

    let data: Record<string, unknown>
    try {
      data = parseGraphqlResponse(rawText)
    } catch {
      lastError = "Could not parse the response"
      continue
    }

    const topErrors =
      (data?.errors as
        | Array<{ code?: number; severity?: string; message?: string }>
        | undefined) ?? []
    if (topErrors.some((e) => e.code === 1357004)) {
      lastError = "Facebook session error (1357004)"
      continue
    }

    const postUrl = extractPostUrl(data, groupId)
    if (postUrl) return { success: true, postUrl, note: "" }

    const critErrs = topErrors.filter(
      (e) => e.severity === "ERROR" || e.severity === "CRITICAL"
    )
    if (critErrs.length) {
      lastError = critErrs[0].message ?? lastError
      continue
    }

    const sc = (data?.data as Record<string, unknown> | undefined)?.story_create
    if (!sc) {
      lastError = "Facebook did not return story_create"
      continue
    }

    const sid = String(
      (sc as Record<string, unknown>).story_id ??
        (sc as Record<string, unknown>).post_id ??
        ""
    )
    return {
      success: true,
      postUrl: sid
        ? `https://www.facebook.com/groups/${groupId}/permalink/${sid}/`
        : `https://www.facebook.com/groups/${groupId}/`,
      note: ""
    }
  }
  throw new Error(lastError)
}

// ─── postShareLinkToTimeline ──────────────────────────────────────────────────

export async function postShareLinkToTimeline(params: {
  content: string
  shareLinkUrl: string
  shareScrapeData?: string | null
  /** Post on this Page's timeline (uses the `i_user` relay); omitted = the profile */
  pageId?: string | null
}): Promise<PostToGroupResult> {
  const { uid, fbDtsg, lsd, siteData: sd } = await getSessionTokens()
  const jazoest = generateJazoest(fbDtsg)
  if (!uid || !fbDtsg)
    throw new Error("Not logged in to Facebook or token is missing.")
  const pageId = params.pageId && params.pageId !== uid ? params.pageId : null
  const actorId = pageId ?? uid

  let scrapeStr = params.shareScrapeData ?? null
  if (!scrapeStr) {
    const preview = await previewShareLink(params.shareLinkUrl)
    if (!preview)
      throw new Error("Could not get link preview data. Try reloading.")
    scrapeStr = preview.shareScrapeData
  }

  const ts = Date.now()
  const n1 = String(Math.floor(Math.random() * 900000) + 100000)

  const variables = {
    input: {
      composer_entry_point: "inline_composer",
      composer_source_surface: "timeline",
      composer_type: "user",
      logging: { composer_session_id: crypto.randomUUID() },
      source: "WWW",
      message: { ranges: [], text: params.content || "" },
      with_tags_ids: null,
      inline_activities: [],
      text_format_preset_id: "0",
      attachments: [
        {
          link: {
            link_call_to_action_type: null,
            link_preview_photo_id: null,
            share_scrape_data: scrapeStr
          }
        }
      ],
      composed_text: (() => {
        const blocks = params.content ? [params.content] : [""]
        return {
          block_data: blocks.map(() => "{}"),
          block_depths: blocks.map(() => 0),
          block_types: blocks.map(() => 0),
          blocks,
          entities: blocks.map(() => "[]"),
          entity_map: "{}",
          inline_styles: blocks.map(() => "[]")
        }
      })(),
      navigation_data: {
        attribution_id_v2: `CometHomeRoot.react,comet.home,unexpected,${ts},${n1},${uid},,,`
      },
      tracking: [null],
      event_share_metadata: { surface: "newsfeed" },
      audience: {
        privacy: {
          allow: [],
          base_state: "EVERYONE",
          deny: [],
          tag_expansion_state: "UNSPECIFIED"
        }
      },
      actor_id: actorId,
      client_mutation_id: "2"
    },
    feedLocation: "TIMELINE",
    feedbackSource: 0,
    focusCommentID: null,
    gridMediaWidth: null,
    groupID: null,
    scale: 1,
    privacySelectorRenderLocation: "COMET_STREAM",
    checkPhotosToReelsUpsellEligibility: false,
    referringStoryRenderLocation: null,
    renderLocation: "timeline",
    useDefaultActor: false,
    inviteShortLinkKey: null,
    isFeed: false,
    isFundraiser: false,
    isFunFactPost: false,
    isGroup: false,
    isEvent: false,
    isTimeline: true,
    isSocialLearning: false,
    isPageNewsFeed: false,
    isProfileReviews: false,
    isWorkSharedDraft: false,
    hashtag: null,
    canUserManageOffers: false,
    __relay_internal__pv__CometFeedShareMedia_shouldPrefetchShareImagerelayprovider:
      false,
    __relay_internal__pv__CometFeedStory_enable_post_permalink_white_space_clickrelayprovider:
      false,
    __relay_internal__pv__CometFeedStory_enable_reactor_facepilerelayprovider:
      false,
    __relay_internal__pv__CometImmersivePhotoCanUserDisable3DMotionrelayprovider:
      false,
    __relay_internal__pv__CometUFICommentActionLinksRewriteEnabledrelayprovider:
      false,
    __relay_internal__pv__CometUFICommentAutoTranslationTyperelayprovider:
      "AUTO_TRANSLATE",
    __relay_internal__pv__CometUFICommentAvatarStickerAnimatedImagerelayprovider:
      false,
    __relay_internal__pv__CometUFIReactionsEnableShortNamerelayprovider: false,
    __relay_internal__pv__CometUFIShareActionMigrationrelayprovider: true,
    __relay_internal__pv__CometUFISingleLineUFIrelayprovider: true,
    __relay_internal__pv__CometUFI_dedicated_comment_routable_dialog_gkrelayprovider:
      true,
    __relay_internal__pv__FBReelsIFUTileContent_reelsIFUPlayOnHoverrelayprovider:
      true,
    __relay_internal__pv__FBReelsMediaFooter_comet_enable_reels_ads_gkrelayprovider:
      true,
    __relay_internal__pv__FBReels_deprecate_short_form_video_context_gkrelayprovider:
      true,
    __relay_internal__pv__FBReels_enable_view_dubbed_audio_type_gkrelayprovider:
      true,
    __relay_internal__pv__GHLShouldChangeAdIdFieldNamerelayprovider: true,
    __relay_internal__pv__GHLShouldChangeSponsoredAuctionDistanceFieldNamerelayprovider:
      false,
    __relay_internal__pv__GHLShouldChangeSponsoredDataFieldNamerelayprovider:
      true,
    __relay_internal__pv__GHLShouldUseSponsoredAuctionLabelFieldNameV1relayprovider:
      false,
    __relay_internal__pv__GHLShouldUseSponsoredAuctionLabelFieldNameV2relayprovider:
      false,
    __relay_internal__pv__IsMergQAPollsrelayprovider: false,
    __relay_internal__pv__IsWorkUserrelayprovider: false,
    __relay_internal__pv__ReelsIFUCard_reelsIFULikeCountrelayprovider: false,
    __relay_internal__pv__ShouldEnableBakedInTextStoriesrelayprovider: false,
    __relay_internal__pv__StoriesShouldIncludeFbNotesrelayprovider: true,
    __relay_internal__pv__TestPilotShouldIncludeDemoAdUseCaserelayprovider:
      false,
    __relay_internal__pv__WorkCometIsEmployeeGKProviderrelayprovider: false,
    __relay_internal__pv__groups_comet_use_glvrelayprovider: false,
    __relay_internal__pv__relay_provider_comet_ufi_ssr_seo_deferrelayprovider:
      true
  }

  const fd = new URLSearchParams(
    Object.entries({
      av: actorId,
      __aaid: String(sd.__aaid ?? "0"),
      __user: uid,
      __a: "1",
      __req: String(sd.__req ?? "1a"),
      __hs: String(sd.__hs ?? ""),
      dpr: String(sd.dpr ?? "1"),
      __ccg: String(sd.__ccg ?? "EXCELLENT"),
      __rev: String(sd.__spin_r ?? ""),
      __s: String(sd.__s ?? sd._s ?? ""),
      __hsi: String(sd.__hsi ?? sd._hsi ?? ""),
      __dyn: String(sd.__dyn ?? ""),
      __csr: String(sd.__csr ?? ""),
      __comet_req: String(sd.__comet_req ?? "15"),
      __spin_r: String(sd.__spin_r ?? ""),
      __spin_b: String(sd.__spin_b ?? "trunk"),
      __spin_t: String(sd.__spin_t ?? ""),
      __crn: "comet.fbweb.CometHomeRoute",
      fb_dtsg: fbDtsg,
      jazoest,
      lsd,
      variables: JSON.stringify(variables),
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "ComposerStoryCreateMutation",
      server_timestamps: "true",
      doc_id: "27043104642009435"
    }).filter(([, v]) => v !== "")
  )

  let lastError = "Could not post the link to the timeline"
  for (let attempt = 0; attempt < 2; attempt++) {
    let rawText: string
    try {
      const res = await request("https://www.facebook.com/api/graphql/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        credentials: "include",
        body: fd.toString(),
        ...(pageId ? { iUser: pageId } : {})
      })
      rawText = res?.data?.body ?? ""
    } catch {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1200))
        continue
      }
      throw new Error("Connection error while posting the link to the timeline")
    }

    let data: Record<string, unknown>
    try {
      data = parseGraphqlResponse(rawText)
    } catch {
      lastError = "Could not parse the response"
      continue
    }

    const topErrors =
      (data?.errors as
        | Array<{ code?: number; severity?: string; message?: string }>
        | undefined) ?? []
    if (topErrors.some((e) => e.code === 1357004)) {
      lastError = "Facebook session error (1357004)"
      continue
    }

    const postUrl = extractPostUrl(data, uid)
    if (postUrl) return { success: true, postUrl, note: "" }

    const critErrs = topErrors.filter(
      (e) => e.severity === "ERROR" || e.severity === "CRITICAL"
    )
    if (critErrs.length) {
      lastError = critErrs[0].message ?? lastError
      continue
    }

    const sc = (data?.data as Record<string, unknown> | undefined)?.story_create
    if (!sc) {
      lastError = "Facebook did not return story_create"
      continue
    }

    const sid = String(
      (sc as Record<string, unknown>).story_id ??
        (sc as Record<string, unknown>).post_id ??
        ""
    )
    return {
      success: true,
      postUrl: sid
        ? `https://www.facebook.com/${uid}/posts/${sid}/`
        : `https://www.facebook.com/${uid}/`,
      note: ""
    }
  }
  throw new Error(lastError)
}

// ─── getGroupFeed ──────────────────────────────────────────────────────────────

export async function getAdsAccessTokenCached(): Promise<string> {
  if (cachedAdsAccessToken) return cachedAdsAccessToken
  try {
    const token = String((await fetchTokenEAAB()) ?? "")
    if (token) cachedAdsAccessToken = token
    return token
  } catch {
    return ""
  }
}

export async function getGroupFeed(
  groupId: string,
  limit = 20
): Promise<FbFeedPost[]> {
  const accessToken = await getAdsAccessTokenCached()
  if (!accessToken) return []

  const fields =
    "id,message,created_time,full_picture,from,reactions.summary(true),comments.summary(true),shares"
  const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(groupId)}/feed?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(accessToken)}`
  const raw = await fbFetch(url, { method: "GET" })
  const body: string = raw?.data?.body ?? ""
  if (!body) return []
  let json: { data?: unknown[]; error?: { message?: string } }
  try {
    json = JSON.parse(body)
  } catch {
    return []
  }
  if (json.error || !Array.isArray(json.data)) return []

  return json.data.map((item) => {
    const p = item as Record<string, unknown>
    const postId = String(p.id ?? "")
    const reactions = p.reactions as Record<string, unknown> | undefined
    const comments = p.comments as Record<string, unknown> | undefined
    const shares = p.shares as Record<string, unknown> | undefined
    const from = p.from as Record<string, unknown> | undefined
    const shortId = postId.includes("_") ? postId.split("_").pop()! : postId
    return {
      postId,
      groupId,
      message: String(p.message ?? ""),
      permalink: `https://www.facebook.com/groups/${groupId}/posts/${shortId}/`,
      createdTime: p.created_time
        ? new Date(String(p.created_time)).getTime() / 1000
        : 0,
      likeCount: Number(
        (reactions?.summary as Record<string, unknown> | undefined)
          ?.total_count ?? 0
      ),
      commentCount: Number(
        (comments?.summary as Record<string, unknown> | undefined)
          ?.total_count ?? 0
      ),
      shareCount: Number(
        (shares as Record<string, unknown> | undefined)?.count ?? 0
      ),
      authorName: String(from?.name ?? ""),
      imageUrl: String(p.full_picture ?? "")
    }
  })
}

// ─── getProfilePageFeed ────────────────────────────────────────────────────────

function mapGraphApiFeedToSourcePosts(
  data: unknown,
  sourceId: string
): FbSourcePost[] {
  const json = data as { data?: unknown[]; error?: unknown } | null
  if (!json || json.error || !Array.isArray(json.data)) return []
  const posts: FbSourcePost[] = []
  for (const item of json.data) {
    const p = item as Record<string, unknown>
    const postId = String(p.id ?? "")
    if (!postId) continue
    const reactions = p.reactions as Record<string, unknown> | undefined
    const comments = p.comments as Record<string, unknown> | undefined
    const shares = p.shares as Record<string, unknown> | undefined
    const from = p.from as Record<string, unknown> | undefined
    posts.push({
      postId,
      sourceId,
      message: String(p.message ?? ""),
      permalink: String(
        p.permalink_url ??
          `https://www.facebook.com/${sourceId}/posts/${postId}`
      ),
      createdTime: p.created_time
        ? new Date(String(p.created_time)).getTime() / 1000
        : 0,
      imageUrl: String(p.full_picture ?? ""),
      likeCount: Number(
        (reactions?.summary as Record<string, unknown> | undefined)
          ?.total_count ?? 0
      ),
      commentCount: Number(
        (comments?.summary as Record<string, unknown> | undefined)
          ?.total_count ?? 0
      ),
      shareCount: Number(
        (shares as Record<string, unknown> | undefined)?.count ?? 0
      ),
      authorName: String(from?.name ?? "")
    })
  }
  return posts
}

function parseGraphqlFeedEdges(
  objs: Record<string, unknown>[],
  sourceId: string
): FbSourcePost[] {
  const posts: FbSourcePost[] = []
  const seenIds = new Set<string>()

  for (const obj of objs) {
    const root = obj?.data as Record<string, unknown> | undefined
    const userOrPage = (root?.user ?? root?.page ?? root?.node) as
      | Record<string, unknown>
      | undefined
    const feed = (userOrPage?.timeline_feed_units ??
      userOrPage?.pageFeed ??
      userOrPage?.timeline_list_feed_units) as
      | Record<string, unknown>
      | undefined
    const edges = feed?.edges as unknown[] | undefined
    if (!Array.isArray(edges)) continue

    for (const edge of edges) {
      const node = (edge as Record<string, unknown>)?.node as
        | Record<string, unknown>
        | undefined
      if (!node) continue
      const storyId = String(node?.id ?? node?.post_id ?? "")
      const sections = (node?.comet_sections as Record<string, unknown>) ?? {}

      // permalink — try node.url, then context_layout url, then wwwURL
      const ctxLayout = sections?.context_layout as
        | Record<string, unknown>
        | undefined
      const ctxStory = ctxLayout?.story as Record<string, unknown> | undefined
      const metaArr =
        deepGet<unknown[]>(
          sections,
          "context_layout",
          "story",
          "comet_sections",
          "metadata"
        ) ?? []
      const metaStory = (metaArr[0] as Record<string, unknown> | undefined)
        ?.story as Record<string, unknown> | undefined
      const permalink = String(
        node?.url ?? node?.wwwURL ?? metaStory?.url ?? ctxStory?.url ?? ""
      )

      const postId = (() => {
        const m = permalink.match(/\/(?:posts|permalink)\/(\d{10,})/)
        if (m) return m[1]
        const m2 = permalink.match(/story_fbid=(\d{10,})/)
        if (m2) return m2[1]
        return postIdFromStory(storyId) ?? storyId
      })()
      if (!postId || seenIds.has(postId)) continue
      seenIds.add(postId)

      // message
      let message = String(
        (node?.message as Record<string, unknown> | undefined)?.text ?? ""
      )
      if (!message)
        message = String(
          deepGet(
            sections,
            "content",
            "story",
            "comet_sections",
            "message_container",
            "story",
            "message",
            "text"
          ) ?? ""
        )
      if (!message)
        message = String(
          deepGet(sections, "content", "story", "message", "text") ?? ""
        )

      // image
      let imageUrl = ""
      try {
        const a0 = (node?.attachments as unknown[])?.[0]
        const media = deepGet<Record<string, unknown>>(
          a0,
          "styles",
          "attachment",
          "media"
        )
        if (media) {
          imageUrl = String(
            (media.photo_image as Record<string, unknown> | undefined)?.uri ??
              (media.viewer_image as Record<string, unknown> | undefined)
                ?.uri ??
              (media.image as Record<string, unknown> | undefined)?.uri ??
              ""
          )
        }
        if (!imageUrl) {
          const sub = deepGet<unknown[]>(
            a0,
            "styles",
            "attachment",
            "all_subattachments",
            "nodes"
          )
          const subMedia = (sub?.[0] as Record<string, unknown> | undefined)
            ?.media as Record<string, unknown> | undefined
          if (subMedia)
            imageUrl = String(
              (subMedia.photo_image as Record<string, unknown> | undefined)
                ?.uri ??
                (subMedia.image as Record<string, unknown> | undefined)?.uri ??
                ""
            )
        }
      } catch {
        /* ignore */
      }

      // reactions / comments / shares — two possible shapes
      const feedback = node?.feedback as Record<string, unknown> | undefined
      const likeCount = Number(
        (feedback?.reaction_count as Record<string, unknown> | undefined)
          ?.count ??
          (feedback?.reactors as Record<string, unknown> | undefined)?.count ??
          (feedback?.like_count as Record<string, unknown> | undefined)
            ?.count ??
          0
      )
      const commentCount = Number(
        feedback?.total_comment_count ??
          (feedback?.comment_count as Record<string, unknown> | undefined)
            ?.count ??
          0
      )
      const shareCount = Number(
        (feedback?.share_count as Record<string, unknown> | undefined)?.count ??
          0
      )

      // author
      const actor0 = (node?.actors as unknown[])?.[0] as
        | Record<string, unknown>
        | undefined
      const authorName = String(actor0?.name ?? "")

      // createdTime
      const createdTime = Number(
        metaStory?.creation_time ?? node?.creation_time ?? 0
      )

      posts.push({
        postId,
        sourceId,
        message,
        permalink:
          permalink || `https://www.facebook.com/${sourceId}/posts/${postId}`,
        createdTime,
        imageUrl,
        likeCount,
        commentCount,
        shareCount,
        authorName
      })
    }
  }
  return posts
}

// Cache doc_id per session to avoid re-fetching
let _cachedPageFeedDocId = ""

async function fetchPageFeedDocId(): Promise<string> {
  if (_cachedPageFeedDocId) return _cachedPageFeedDocId
  try {
    const res = await request("https://www.facebook.com/", {
      credentials: "include",
      headers: { Accept: "text/html,application/xhtml+xml" }
    })
    const html: string = res?.data?.body ?? ""
    // Look for ProfileCometTimelineFeedQuery doc_id in the JS bundles list
    const m =
      html.match(
        /"ProfileCometTimelineFeedQuery"[^}]{0,200}"id"\s*:\s*"(\d{10,})"/
      ) ??
      html.match(
        /"id"\s*:\s*"(\d{10,})"[^}]{0,200}"name"\s*:\s*"ProfileCometTimelineFeedQuery"/
      )
    if (m) {
      _cachedPageFeedDocId = m[1]
      return m[1]
    }
  } catch {
    /* ignore */
  }
  return ""
}

export async function getProfilePageFeed(
  sourceId: string,
  limit = 25
): Promise<FbSourcePost[]> {
  // ── Strategy 1: Graph API (same as getGroupFeed — stable, full data) ─────
  const accessToken = await getAdsAccessTokenCached()
  if (accessToken) {
    const fields =
      "id,message,created_time,full_picture,permalink_url,from,reactions.summary(true),comments.summary(true),shares"
    const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(sourceId)}/feed?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(accessToken)}`
    try {
      const raw = await fbFetch(url, { method: "GET" })
      const body: string = raw?.data?.body ?? ""
      if (body) {
        const json = JSON.parse(body)
        const posts = mapGraphApiFeedToSourcePosts(json, sourceId)
        if (posts.length > 0) return posts
      }
    } catch {
      /* fallthrough */
    }
  }

  // ── Strategy 2: Internal GraphQL with auto-fetched doc_id ────────────────
  const { uid, fbDtsg, lsd, siteData } = await getSessionTokens()
  if (!uid || !fbDtsg) return []

  const spinR = String(siteData?.__spin_r ?? "")
  const spinB = String(siteData?.__spin_b ?? "trunk")
  const spinT = String(siteData?.__spin_t ?? "")

  // Try multiple (query name, doc_id, variables) combos — newer ones first
  const strategies: Array<{
    name: string
    docId: string
    vars: Record<string, unknown>
    crn: string
  }> = [
    {
      name: "CometPageTimelineFeedPaginationQuery",
      docId: "9107301655981497",
      vars: { pageID: sourceId, count: limit, scale: 1 },
      crn: "comet.fbweb.CometPageRoute"
    },
    {
      name: "CometPageFeedPaginationQuery",
      docId: "8989655334408483",
      vars: { pageID: sourceId, count: limit, scale: 1 },
      crn: "comet.fbweb.CometPageRoute"
    },
    {
      name: "ProfileCometTimelineFeedQuery",
      docId: await fetchPageFeedDocId(),
      vars: { userID: sourceId, count: limit, scale: 1 },
      crn: "comet.fbweb.CometUserRoute"
    }
  ].filter((s) => !!s.docId)

  for (const strat of strategies) {
    const params = new URLSearchParams({
      av: uid,
      __aaid: "0",
      __user: uid,
      __a: "1",
      __comet_req: "15",
      fb_dtsg: fbDtsg,
      lsd,
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: strat.name,
      variables: JSON.stringify(strat.vars),
      server_timestamps: "true",
      doc_id: strat.docId,
      __spin_r: spinR,
      __spin_b: spinB,
      __spin_t: spinT,
      __crn: strat.crn
    })

    try {
      const res = await request("https://www.facebook.com/api/graphql/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        credentials: "include",
        body: params.toString()
      })

      const rawText: string = res?.data?.body ?? ""
      if (!rawText) continue

      // If doc_id not found, skip immediately
      if (
        rawText.includes('"The GraphQL document with ID') ||
        rawText.includes('"was not found"')
      )
        continue

      const objs = parseGraphqlChunks(rawText)
      const posts = parseGraphqlFeedEdges(objs, sourceId)
      if (posts.length > 0) return posts
    } catch {
      continue
    }
  }

  return []
}

// ─── searchPostsPage ───────────────────────────────────────────────────────────

function parseSearchPostEdge(edge: unknown): CkSearchPost | null {
  try {
    // edge.rendering_strategy.view_model.click_model.story ← story object (same as zoonhom)
    const story = deepGet<Record<string, unknown>>(
      edge,
      "rendering_strategy",
      "view_model",
      "click_model",
      "story"
    )
    if (!story?.post_id) return null

    const postId = String(story.post_id)
    const sections = (story.comet_sections as Record<string, unknown>) ?? {}
    const feedback = story.feedback as Record<string, unknown> | undefined

    const associatedGroup = feedback?.associated_group as
      | Record<string, unknown>
      | undefined
    let groupId = associatedGroup?.id ? String(associatedGroup.id) : null
    if (!groupId) groupId = findGroupIdInSections(sections)

    // author: prefer story.actors[0], fallback owning_profile
    const actors0 = (story.actors as unknown[])?.[0] as
      | Record<string, unknown>
      | undefined
    const owning = feedback?.owning_profile as
      | Record<string, unknown>
      | undefined
    const authorName = String(actors0?.name ?? owning?.name ?? "")
    const authorId = actors0?.id
      ? String(actors0.id)
      : owning?.id
        ? String(owning.id)
        : ""
    const authorProfileUrl = authorId
      ? `https://www.facebook.com/profile.php?id=${authorId}`
      : String(actors0?.url ?? "")

    // messageText: story.message.text first (direct), then nested paths
    let messageText = String(
      story.message ? (story.message as Record<string, unknown>).text ?? "" : ""
    )
    if (!messageText) {
      messageText = String(
        deepGet(
          sections,
          "content",
          "story",
          "comet_sections",
          "message_container",
          "story",
          "message",
          "text"
        ) ?? ""
      )
    }
    if (!messageText) {
      const richMsg =
        deepGet<unknown[]>(
          sections,
          "content",
          "story",
          "comet_sections",
          "message",
          "story",
          "rich_message"
        ) ?? []
      messageText = richMsg
        .map((b: unknown) => String((b as Record<string, unknown>)?.text ?? ""))
        .join("\n")
    }

    // image: attachments[0].styles.attachment.media, with sub-attachment fallback
    let imageUrl = ""
    try {
      const a0 = (story.attachments as unknown[])?.[0]
      const styles = deepGet<Record<string, unknown>>(
        a0,
        "styles",
        "attachment"
      )
      const media = styles?.media as Record<string, unknown> | undefined
      if (media) {
        imageUrl = String(
          (media.photo_image as Record<string, unknown> | undefined)?.uri ??
            (media.viewer_image as Record<string, unknown> | undefined)?.uri ??
            (media.image as Record<string, unknown> | undefined)?.uri ??
            (
              (media.preferred_thumbnail as Record<string, unknown> | undefined)
                ?.image as Record<string, unknown> | undefined
            )?.uri ??
            ""
        )
      }
      if (!imageUrl) {
        const sub = (
          styles?.all_subattachments as Record<string, unknown> | undefined
        )?.nodes as unknown[] | undefined
        const subMedia = (sub?.[0] as Record<string, unknown> | undefined)
          ?.media as Record<string, unknown> | undefined
        if (subMedia) {
          imageUrl = String(
            (subMedia.photo_image as Record<string, unknown> | undefined)
              ?.uri ??
              (subMedia.viewer_image as Record<string, unknown> | undefined)
                ?.uri ??
              (subMedia.image as Record<string, unknown> | undefined)?.uri ??
              ""
          )
        }
      }
    } catch {
      /* ignore */
    }

    // creationTime: metadata[0].story.creation_time → story.creation_time → deep search
    const metaArr =
      deepGet<unknown[]>(
        sections,
        "context_layout",
        "story",
        "comet_sections",
        "metadata"
      ) ?? []
    const metaTime = (metaArr[0] as Record<string, unknown> | undefined)?.story
      ? (
          (metaArr[0] as Record<string, unknown>).story as Record<
            string,
            unknown
          >
        )?.creation_time
      : undefined
    const creationTime = Number(
      metaTime ??
        story.creation_time ??
        findDeep(sections, "creation_time") ??
        0
    )

    // postUrl: wwwURL first (direct permalink), then story.url, then construct
    let postUrl = String(story.wwwURL ?? story.url ?? "")
    if (!postUrl) {
      const metaUrl = (metaArr[0] as Record<string, unknown> | undefined)?.story
        ? (
            (metaArr[0] as Record<string, unknown>).story as Record<
              string,
              unknown
            >
          )?.url
        : undefined
      postUrl = String(metaUrl ?? "")
    }
    if (!postUrl && groupId)
      postUrl = `https://www.facebook.com/groups/${groupId}/posts/${postId}/`
    if (!postUrl) postUrl = `https://www.facebook.com/${postId}`

    // groupName: context_layout.story.comet_sections.title.story.actors
    let groupName = ""
    try {
      const titleStory = deepGet<Record<string, unknown>>(
        sections,
        "context_layout",
        "story",
        "comet_sections",
        "title",
        "story"
      )
      const actors = (titleStory?.actors as unknown[]) ?? []
      if (actors.length > 1)
        groupName = String((actors[1] as Record<string, unknown>)?.name ?? "")
      else if (actors.length === 1)
        groupName = String((actors[0] as Record<string, unknown>)?.name ?? "")
    } catch {
      /* ignore */
    }
    if (!groupName && groupId) groupName = authorName

    return {
      postId,
      groupId: groupId ?? "",
      authorName,
      authorProfileUrl,
      messageText,
      imageUrl,
      creationTime,
      postUrl,
      groupName
    }
  } catch {
    return null
  }
}

export async function searchPostsPage(
  keyword: string,
  filters: string[],
  cursor: string | null
): Promise<SearchPostsPageResult> {
  const { uid, fbDtsg, lsd, siteData } = await getSessionTokens()
  if (!uid || !fbDtsg) return { posts: [], nextCursor: null, hasMore: false }

  const spinR = String(siteData?.__spin_r ?? "")
  const spinB = String(siteData?.__spin_b ?? "trunk")
  const spinT = String(siteData?.__spin_t ?? "")

  const variables = {
    allow_streaming: false,
    args: {
      callsite: "COMET_GLOBAL_SEARCH",
      config: {
        exact_match: false,
        high_confidence_config: null,
        intercept_config: null,
        sts_disambiguation: null,
        watch_config: null
      },
      context: { bsid: crypto.randomUUID(), tsid: null },
      experience: {
        client_defined_experiences: ["ADS_PARALLEL_FETCH"],
        encoded_server_defined_params: null,
        fbid: null,
        type: "GLOBAL_SEARCH"
      },
      filters: filters || [],
      text: keyword
    },
    count: 5,
    cursor: cursor ?? null,
    feedLocation: "SEARCH",
    feedbackSource: 23,
    fetch_filters: true,
    focusCommentID: null,
    locale: null,
    privacySelectorRenderLocation: "COMET_STREAM",
    referringStoryRenderLocation: null,
    renderLocation: "search_results_page",
    scale: 1,
    stream_initial_count: 0,
    useDefaultActor: false
  }

  const params = new URLSearchParams({
    av: uid,
    __aaid: "0",
    __user: uid,
    __a: "1",
    __comet_req: "15",
    fb_dtsg: fbDtsg,
    lsd,
    fb_api_caller_class: "RelayModern",
    fb_api_req_friendly_name: "SearchCometResultsPaginatedResultsQuery",
    variables: JSON.stringify(variables),
    server_timestamps: "true",
    doc_id: "35214564461476247",
    __spin_r: spinR,
    __spin_b: spinB,
    __spin_t: spinT
  })

  try {
    const res = await request("https://www.facebook.com/api/graphql/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      credentials: "include",
      body: params.toString()
    })

    const rawText = res?.data?.body ?? ""
    // Parse theo pattern chunks[0]/chunks[1] (same as use-posts.ts)
    let chunks: Record<string, unknown>[] = []
    try {
      const cleaned = rawText.replace(/for\s*\(;;\);/, "").trim()
      if (cleaned.startsWith("[")) {
        chunks = JSON.parse(cleaned) as Record<string, unknown>[]
      } else {
        chunks = cleaned
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => JSON.parse(l) as Record<string, unknown>)
      }
    } catch {
      /* fallback to parseGraphqlChunks */
    }

    if (!chunks.length) chunks = parseGraphqlChunks(rawText)

    const posts: CkSearchPost[] = []
    let nextCursor: string | null = null

    for (const obj of chunks) {
      const sr = (obj?.data as Record<string, unknown> | undefined)
        ?.serpResponse as Record<string, unknown> | undefined
      if (!sr) continue
      const results = sr.results as Record<string, unknown> | undefined
      if (!results) continue
      const pi = results.page_info as Record<string, unknown> | undefined
      if (pi?.end_cursor) nextCursor = String(pi.end_cursor)
      for (const edge of (results.edges as unknown[]) ?? []) {
        const p = parseSearchPostEdge(edge)
        if (p) posts.push(p)
      }
    }

    // chunks[1] có thể chứa page_info riêng (như use-posts.ts)
    const pageInfoChunk = chunks[1] as Record<string, unknown> | undefined
    if (pageInfoChunk) {
      const pi2 = (pageInfoChunk?.data as Record<string, unknown> | undefined)
        ?.page_info as Record<string, unknown> | undefined
      if (pi2?.end_cursor) nextCursor = String(pi2.end_cursor)
    }

    return { posts, nextCursor, hasMore: !!nextCursor }
  } catch {
    return { posts: [], nextCursor: null, hasMore: false }
  }
}

// ─── getGroupAnonProfileId ─────────────────────────────────────────────────────

export async function getGroupAnonProfileId(
  groupId: string
): Promise<string | null> {
  try {
    const res = await request(`https://www.facebook.com/groups/${groupId}/`, {
      credentials: "include",
      headers: { Accept: "text/html" }
    })
    const html: string = res?.data?.body ?? ""
    const m = html.match(/"GroupAnonAuthorProfile"[^}]*?"id"\s*:\s*"(\d+)"/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

export default {
  postToGroup,
  reactPost,
  commentOnPost,
  uploadImages,
  uploadVideo,
  previewShareLink,
  postShareLinkToGroup,
  postShareLinkToTimeline,
  getAdsAccessTokenCached,
  getGroupFeed,
  getProfilePageFeed,
  searchPostsPage,
  getGroupAnonProfileId
}
