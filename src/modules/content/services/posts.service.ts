/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  fetchGraphQl,
  getFbDtsg,
  parseSafe
} from "src/modules/facebook/services/fb-graphql.service"

import type {
  Post,
  PostAction,
  PostPrivacy,
  PostsListResult,
  PostsPage,
  PostType,
  StoryCurationAction
} from "src/modules/content/types/posts.types"

/** Port of xthuy-social `modules/extension/facebook/posts/use-posts` (request + parsing part). */
const DATA_GRAPHQL = {
  LIST: {
    name: "CometManagePostsFeedRefetchQuery",
    docId: "31630222699958359"
  },
  DELETE: {
    name: "ProfileCometBulkStoryCurationMutation",
    docId: "24993115590355210"
  },
  HIDE: {
    name: "ProfileCometBulkStoryCurationMutation",
    docId: "24938576555792031"
  },
  UNTAG: {
    name: "ProfileCometBulkStoryCurationMutation",
    docId: "24938576555792031"
  },
  TRASH: {
    name: "useCometTrashPostMutation",
    docId: "25341779168739270"
  },
  ARCHIVE: {
    name: "useCometArchivePostMutation",
    docId: "25027189710230521"
  }
}

function getStoryCurationVariables(storyId: string, action: StoryCurationAction, uid: string) {
  return {
    input: {
      story_actions: [
        {
          action,
          story_id: storyId,
          story_location: "TIMELINE"
        }
      ],
      actor_id: uid,
      client_mutation_id: String(Date.now())
    },
    afterTime: null,
    beforeTime: null,
    feedLocation: "TIMELINE",
    feedbackSource: 0,
    focusCommentID: null,
    gridMediaWidth: 230,
    includeGroupScheduledPosts: false,
    includeScheduledPosts: false,
    memorializedSplitTimeFilter: null,
    postedBy: null,
    privacy: null,
    privacySelectorRenderLocation: "COMET_STREAM",
    scale: 1,
    taggedInOnly: null,
    omitPinnedPost: true,
    renderLocation: "timeline",
    useDefaultActor: false,
    trackingCode: null,
    is_professional_dashboard: false,
    __relay_internal__pv__GHLShouldChangeSponsoredDataFieldNamerelayprovider: true,
    __relay_internal__pv__GHLShouldChangeAdIdFieldNamerelayprovider: true,
    __relay_internal__pv__FBReels_enable_view_dubbed_audio_type_gkrelayprovider: false,
    __relay_internal__pv__CometUFICommentAvatarStickerAnimatedImagerelayprovider: false,
    __relay_internal__pv__IsWorkUserrelayprovider: false,
    __relay_internal__pv__TestPilotShouldIncludeDemoAdUseCaserelayprovider: false,
    __relay_internal__pv__FBReels_deprecate_short_form_video_context_gkrelayprovider: true,
    __relay_internal__pv__FeedDeepDiveTopicPillThreadViewEnabledrelayprovider: false,
    __relay_internal__pv__CometImmersivePhotoCanUserDisable3DMotionrelayprovider: false,
    __relay_internal__pv__WorkCometIsEmployeeGKProviderrelayprovider: false,
    __relay_internal__pv__IsMergQAPollsrelayprovider: false,
    __relay_internal__pv__FBReels_enable_meta_ai_label_gkrelayprovider: true,
    __relay_internal__pv__FBReelsMediaFooter_comet_enable_reels_ads_gkrelayprovider: true,
    __relay_internal__pv__CometUFIReactionsEnableShortNamerelayprovider: false,
    __relay_internal__pv__CometUFIShareActionMigrationrelayprovider: true,
    __relay_internal__pv__CometUFI_dedicated_comment_routable_dialog_gkrelayprovider: false,
    __relay_internal__pv__StoriesArmadilloReplyEnabledrelayprovider: true,
    __relay_internal__pv__FBReelsIFUTileContent_reelsIFUPlayOnHoverrelayprovider: true,
    __relay_internal__pv__GroupsCometGYSJFeedItemHeightrelayprovider: 206,
    __relay_internal__pv__StoriesShouldIncludeFbNotesrelayprovider: false
  }
}

function getTrashArchiveVariables(storyId: string, uid: string) {
  return {
    input: {
      story_id: storyId,
      story_location: "TIMELINE",
      actor_id: uid,
      client_mutation_id: String(Date.now())
    }
  }
}

/** Splits an NDJSON GraphQL body into objects (lines that fail to parse are skipped). */
function parseGraphQLResponse(responseText: string | null | undefined): any[] {
  if (!responseText) return []
  const lines = responseText
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  const parsedObjects: any[] = []
  for (const line of lines) {
    try {
      const cleanLine = line.replace("for (;;);", "").trim()
      if (cleanLine) {
        parsedObjects.push(JSON.parse(cleanLine))
      }
    } catch (e) {
      console.error("Failed to parse line:", line, e)
    }
  }
  return parsedObjects
}

// ==================== LIST ====================

function getConnection(chunk: any): any {
  return chunk?.data?.node?.timeline_manage_feed_units || chunk?.data?.timeline_manage_feed_units
}

/** Extracts `edges` + `page_info` from the streamed response (primary scanner, then chunk fallback). */
function extractEdges(body: unknown): { edges: any[]; pageInfo: any } {
  let edges: any[] = []
  let pageInfo: any = null

  if (typeof body === "string") {
    try {
      const cleaned = body.replaceAll("for (;;);", "").trim()
      let chunks: any[] = []
      if (cleaned.startsWith("[")) {
        chunks = JSON.parse(cleaned)
      } else {
        chunks = cleaned
          .split("\n")
          .map((line: string) => line.trim())
          .filter(Boolean)
          .map((line: string) => JSON.parse(line))
      }
      const dataChunk = chunks[0]
      const pageInfoChunk = chunks[1]
      if (dataChunk) {
        const connectionObj = getConnection(dataChunk)
        if (connectionObj?.edges) {
          edges = connectionObj.edges
        }
        if (connectionObj?.page_info) {
          pageInfo = connectionObj.page_info
        }
      }

      if (pageInfoChunk) {
        if (pageInfoChunk?.data?.page_info) {
          pageInfo = pageInfoChunk.data.page_info
        } else {
          const connectionObj = getConnection(pageInfoChunk)
          if (connectionObj?.page_info) {
            pageInfo = connectionObj.page_info
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse facebook response chunks:", e)
    }
  }

  // Fallback to chunks parser if scanner missed edges or pageInfo
  if (edges.length === 0 || !pageInfo) {
    const parsed = parseSafe(body, {}, true)
    const chunks = Array.isArray(parsed) ? parsed : [parsed]
    for (const chunk of chunks) {
      const connectionObj = getConnection(chunk)
      if (connectionObj?.edges && edges.length === 0) {
        edges = connectionObj.edges
      }
      if (connectionObj?.page_info && !pageInfo) {
        pageInfo = connectionObj.page_info
      }
      if (chunk?.data?.page_info && !pageInfo) {
        pageInfo = chunk.data.page_info
      }
    }
  }

  return { edges, pageInfo }
}

function pickAttachmentThumbnail(m: any, withSubattachments: boolean): string | null {
  return (
    m?.style_type_renderer?.attachment?.media?.preferred_thumbnail?.image?.uri ||
    m?.style_type_renderer?.attachment?.media?.image?.uri ||
    m?.style_type_renderer?.attachment?.media?.fallback_image?.uri ||
    (withSubattachments
      ? m?.style_type_renderer?.attachment?.all_subattachments?.nodes?.[0]?.media?.image?.uri
      : null) ||
    m?.media?.preferred_thumbnail?.image?.uri ||
    m?.media?.image?.uri ||
    m?.media?.photo_image?.uri ||
    m?.image?.uri ||
    null
  )
}

/** Normalises the audience label (vi/en) to a privacy value. */
export function detectPrivacy(privacyLabel: string): PostPrivacy {
  const lowerLabel = privacyLabel.toLowerCase()
  if (lowerLabel.includes("công khai") || lowerLabel.includes("public") || lowerLabel.includes("everyone")) {
    return "EVERYONE"
  }
  if (lowerLabel.includes("bạn bè") || lowerLabel.includes("friends")) {
    return "FRIENDS"
  }
  if (lowerLabel.includes("chỉ mình tôi") || lowerLabel.includes("only me") || lowerLabel.includes("self")) {
    return "ONLY_ME"
  }
  return "CUSTOM"
}

/** Maps one `timeline_manage_feed_units` edge to a Post. */
export function mapPostEdge(edge: any, uid: string): Post | null {
  const node = edge?.node
  if (!node) return null

  const message =
    node.message?.text ||
    node.attached_story?.comet_sections?.message?.story?.message?.text ||
    node.summary?.text ||
    node.title?.text ||
    ""

  let thumbnail: string | null = null
  try {
    const s = node.attachments || []
    if (s.length > 0) {
      thumbnail = pickAttachmentThumbnail(s[0], false)
    }
    if (!thumbnail && node.attached_story?.attachments?.length > 0) {
      thumbnail = pickAttachmentThumbnail(node.attached_story.attachments[0], true)
    }
  } catch (e) {
    console.error("Error parsing attachments:", e)
  }

  const actorId = node.comet_sections?.actor_photo?.story?.actors?.[0]?.id || null
  const negativeFeedbackActionType = node.negative_feedback_actions?.edges?.[0]?.node?.negative_feedback_action_type

  let type: PostType
  if (negativeFeedbackActionType === "UNTAG") {
    type = "tagged"
  } else if (node.attached_story) {
    type = "share"
  } else if (actorId === uid) {
    type = "own"
  } else {
    type = "tagged"
  }

  const privacyLabel: string =
    node.comet_sections?.audience?.story?.privacy_scope?.privacy_scope_renderer?.entry_point_renderer?.source?.scope?.label ||
    node.comet_sections?.audience?.story?.privacy_scope?.description ||
    "Unknown"

  return {
    storyId: node.id,
    message,
    url: node.url || `https://facebook.com/${node.id}`,
    privacy: detectPrivacy(privacyLabel),
    privacyLabel,
    creationTime: node.creation_time || 0,
    attachments: thumbnail ? [{ imageUri: thumbnail }] : [],
    canDelete: node.can_viewer_delete ?? false,
    type
  }
}

/** Fetches one page (6 stories) of the "Manage posts" feed. Returns null when the page has no edges. */
export async function fetchPostsPage(uid: string, cursor: string | null): Promise<PostsPage | null> {
  const variables = {
    count: 6,
    id: uid,
    cursor: cursor ?? null,
    afterTime: null,
    beforeTime: null,
    postedBy: null,
    privacy: null,
    taggedInOnly: false,
    gridMediaWidth: 230,
    includeScheduledPosts: false,
    omitPinnedPost: true,
    privacySelectorRenderLocation: "COMET_STREAM",
    renderLocation: "timeline",
    scale: 1,
    __relay_internal__pv__GHLShouldChangeSponsoredDataFieldNamerelayprovider: true
  }

  const response = await fetchGraphQl(
    {
      __user: uid,
      av: uid,
      fb_api_req_friendly_name: DATA_GRAPHQL.LIST.name,
      fb_api_caller_class: "RelayModern",
      dpr: 1,
      __a: 1,
      __comet_req: 15,
      server_timestamps: true,
      doc_id: DATA_GRAPHQL.LIST.docId,
      fb_dtsg: getFbDtsg(),
      variables
    },
    {
      autoAddParams: false
    }
  )

  const { edges, pageInfo } = extractEdges(response?.data?.body)
  if (edges.length === 0) return null

  const posts = edges.map((edge) => mapPostEdge(edge, uid)).filter((p): p is Post => p !== null)

  const lastEdge = edges[edges.length - 1]
  const nextCursor: string | null = pageInfo?.end_cursor ?? lastEdge?.cursor ?? null
  const hasNextPage: boolean = pageInfo?.has_next_page ?? !!nextCursor

  return { posts, nextCursor, hasNextPage }
}

/**
 * Walks the feed from `cursor` to the last page, appending to `accList`.
 * `onPage` fires after every page with the accumulated list.
 * `complete` is true when the last page was reached (source only cached in that case).
 */
export async function fetchAllPosts(
  uid: string,
  cursor: string | null,
  accList: Post[] = [],
  onPage?: (list: Post[], nextCursor: string | null, hasNextPage: boolean) => void
): Promise<PostsListResult> {
  let currentCursor = cursor
  let list = accList

  while (true) {
    const page = await fetchPostsPage(uid, currentCursor)
    if (!page) return { list, complete: false }

    list = list.concat(page.posts)
    onPage?.(list, page.nextCursor, page.hasNextPage)

    if (!page.hasNextPage || !page.nextCursor) return { list, complete: true }
    // Guard against Facebook returning the same cursor forever (source recursed without a check).
    if (page.nextCursor === currentCursor) return { list, complete: true }
    currentCursor = page.nextCursor
  }
}

// ==================== ACTIONS ====================

const CURATION_CONFIG: Record<"delete" | "hide" | "untag", { gql: { name: string; docId: string }; action: StoryCurationAction }> = {
  delete: { gql: DATA_GRAPHQL.DELETE, action: "DELETE" },
  hide: { gql: DATA_GRAPHQL.HIDE, action: "HIDE_FROM_TIMELINE" },
  untag: { gql: DATA_GRAPHQL.UNTAG, action: "UNTAG" }
}

/** Delete / hide from timeline / untag through ProfileCometBulkStoryCurationMutation. */
export async function curateStory(uid: string, storyId: string, type: "delete" | "hide" | "untag"): Promise<boolean> {
  try {
    const { gql, action } = CURATION_CONFIG[type]
    const response = await fetchGraphQl({
      fb_api_req_friendly_name: gql.name,
      fb_api_caller_class: "RelayModern",
      av: uid,
      doc_id: gql.docId,
      variables: getStoryCurationVariables(storyId, action, uid)
    })

    const parsedArray = parseGraphQLResponse(response?.data?.body)
    const hasErrors = parsedArray.some((obj) => obj?.errors && obj.errors.length > 0)
    const hasData = parsedArray.some((obj) => !!obj?.data)
    return hasData && !hasErrors
  } catch {
    return false
  }
}

async function trashOrArchive(uid: string, storyId: string, gql: { name: string; docId: string }): Promise<boolean> {
  try {
    const response = await fetchGraphQl({
      fb_api_req_friendly_name: gql.name,
      fb_api_caller_class: "RelayModern",
      av: uid,
      doc_id: gql.docId,
      variables: getTrashArchiveVariables(storyId, uid)
    })

    const parsed = parseSafe(response?.data?.body)
    return !!parsed?.data && !parsed?.errors
  } catch {
    return false
  }
}

/** Move a story to the trash (restorable for 30 days). */
export function trashPost(uid: string, storyId: string): Promise<boolean> {
  return trashOrArchive(uid, storyId, DATA_GRAPHQL.TRASH)
}

/** Archive a story. */
export function archivePost(uid: string, storyId: string): Promise<boolean> {
  return trashOrArchive(uid, storyId, DATA_GRAPHQL.ARCHIVE)
}

/** Runs any post action; returns Facebook's success flag. */
export function runPostAction(uid: string, type: PostAction, storyId: string): Promise<boolean> {
  if (type === "trash") return trashPost(uid, storyId)
  if (type === "archive") return archivePost(uid, storyId)
  return curateStory(uid, storyId, type)
}

const postsService = {
  fetchPostsPage,
  fetchAllPosts,
  mapPostEdge,
  detectPrivacy,
  curateStory,
  trashPost,
  archivePost,
  runPostAction
}

export default postsService
