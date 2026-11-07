/**
 * Post Radar: scan a group / page feed, then re-share or clone the picked
 * posts into the user's groups. Ported from xthuy-social
 * `post-radar/use-post-radar.ts` + `post-radar/Panel.tsx` (request parts only).
 *
 * Plain async functions (no React / toast / i18n). Feed reads and posting go
 * through the shared `fb-post.service` (same requests as the source
 * `fb-post-api.ts`).
 */
import type {
  RadarPost,
  RadarPublishResult,
  RadarSource,
  RadarTargetGroup
} from "src/modules/automation/types/post-radar.types"
import {
  getGroupAnonProfileId,
  getGroupFeed,
  getProfilePageFeed,
  postShareLinkToGroup,
  postToGroup,
  uploadImages
} from "src/modules/facebook/services/fb-post.service"
import { getGroups } from "src/modules/facebook/services/synced-groups.service"

// ─── Source parsing ────────────────────────────────────────────────────────────

/** Group / page link, `profile.php?id=`, numeric id (group first) or page slug. */
export function parseSourceFromInput(input: string): RadarSource {
  const s = input.trim()
  // group link: facebook.com/groups/ID
  const groupMatch = s.match(/facebook\.com\/groups\/([^/?&#]+)/i)
  if (groupMatch) return { type: "group", id: groupMatch[1] }
  // page/profile link: facebook.com/pagename or /profile.php?id=...
  const profileIdMatch = s.match(/profile\.php\?id=(\d+)/i)
  if (profileIdMatch) return { type: "page", id: profileIdMatch[1] }
  const pageMatch = s.match(/facebook\.com\/([^/?&#]+)/i)
  if (pageMatch && pageMatch[1] !== "groups")
    return { type: "page", id: pageMatch[1] }
  // pure numeric ID → try group first
  if (/^\d+$/.test(s)) return { type: "group", id: s }
  // non-numeric slug
  if (s.length > 0) return { type: "page", id: s }
  return { type: "unknown", id: "" }
}

export function guessPostType(post: {
  message: string
  imageUrl: string
  permalink: string
}): RadarPost["postType"] {
  if (post.permalink.includes("/videos/") || post.permalink.includes("watch"))
    return "video"
  if (post.imageUrl) return "photo"
  if (!post.message && !post.imageUrl) return "link"
  return "text"
}

// ─── Scan ──────────────────────────────────────────────────────────────────────

/** Reads up to `limit` posts of a group (`getGroupFeed`) or a profile / page (`getProfilePageFeed`). */
export async function scanSourcePosts(
  source: RadarSource,
  limit: number
): Promise<RadarPost[]> {
  if (!source.id) return []

  if (source.type === "group") {
    const rawPosts = await getGroupFeed(source.id, limit)
    return rawPosts.map((p) => ({
      postId: p.postId,
      sourceId: p.groupId ?? source.id,
      message: p.message,
      permalink: p.permalink,
      createdTime: p.createdTime,
      imageUrl: p.imageUrl,
      postType: guessPostType(p),
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      shareCount: p.shareCount,
      authorName: p.authorName
    }))
  }

  const rawPosts = await getProfilePageFeed(source.id, limit)
  return rawPosts.map((p) => ({
    postId: p.postId,
    sourceId: p.sourceId,
    message: p.message,
    permalink: p.permalink,
    createdTime: p.createdTime,
    imageUrl: p.imageUrl,
    postType: guessPostType(p),
    likeCount: p.likeCount,
    commentCount: p.commentCount,
    shareCount: p.shareCount,
    authorName: p.authorName
  }))
}

// ─── Target groups (replaces Laravel /api/v1/extension/groups) ────────────────

/** Groups synced for every identity (deduplicated), from the local store. */
export async function loadTargetGroups(): Promise<RadarTargetGroup[]> {
  const { groups } = await getGroups()
  return groups.map((g) => ({
    groupId: g.groupId,
    groupName: g.groupName,
    avatarUrl: g.avatarUrl
  }))
}

// ─── Publish ───────────────────────────────────────────────────────────────────

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Downloads a post image as a data URL. Tries a direct fetch first (as the
 * source did), then the service worker's `INBOX_FETCH_IMAGE_BASE64` for CDN
 * hosts that refuse CORS from www.facebook.com.
 */
export async function fetchImageAsDataUrl(url: string): Promise<string> {
  try {
    const resp = await fetch(url)
    if (resp.ok) return await blobToDataUrl(await resp.blob())
  } catch {
    /* fall back to the service worker */
  }
  return new Promise<string>((resolve) => {
    try {
      chrome.runtime.sendMessage(
        { action: "INBOX_FETCH_IMAGE_BASE64", url },
        (res: { success?: boolean; base64?: string } | undefined) => {
          if (chrome.runtime.lastError) return resolve("")
          resolve(res?.success && res.base64 ? res.base64 : "")
        }
      )
    } catch {
      resolve("")
    }
  })
}

/**
 * Posts one radar post into one group.
 * - `share`: share the original permalink (empty caption).
 * - `clone`: re-upload the image (if any) and post `cloneCaption` + original text.
 * `anonCache` memoises the anonymous author id per group for the whole run.
 * Throws when the underlying post request throws (caller logs it as an error).
 */
export async function publishRadarPost({
  post,
  group,
  postMode,
  cloneCaption,
  isAnonymous,
  anonCache
}: {
  post: RadarPost
  group: RadarTargetGroup
  postMode: "share" | "clone"
  cloneCaption: string
  isAnonymous: boolean
  anonCache: Record<string, string | null>
}): Promise<RadarPublishResult> {
  let anonActorId: string | null = null

  if (isAnonymous) {
    if (!(group.groupId in anonCache)) {
      try {
        anonCache[group.groupId] = await getGroupAnonProfileId(group.groupId)
      } catch {
        anonCache[group.groupId] = null
      }
    }
    anonActorId = anonCache[group.groupId] ?? null
    if (!anonActorId) {
      return {
        success: false,
        postUrl: post.permalink,
        reason: "no_anonymous_support"
      }
    }
  }

  if (postMode === "clone") {
    // Download the image if any, upload it, then publish a new post
    let photoIds: string[] = []
    if (post.imageUrl) {
      try {
        const dataUrl = await fetchImageAsDataUrl(post.imageUrl)
        photoIds = dataUrl
          ? await uploadImages([{ dataUrl, name: "image.jpg" }])
          : []
      } catch {
        photoIds = []
      }
    }
    const content = cloneCaption
      ? cloneCaption + (post.message ? "\n\n" + post.message : "")
      : post.message
    return postToGroup({
      groupId: group.groupId,
      content,
      photoIds,
      anonymousActorId: anonActorId
    })
  }

  return postShareLinkToGroup({
    groupId: group.groupId,
    content: "",
    shareLinkUrl: post.permalink,
    anonymousActorId: anonActorId
  })
}

const postRadarService = {
  parseSourceFromInput,
  guessPostType,
  scanSourcePosts,
  loadTargetGroups,
  fetchImageAsDataUrl,
  publishRadarPost
}

export default postRadarService
