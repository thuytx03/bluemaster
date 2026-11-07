/**
 * Facebook requests of the auto-bot-comment tool (port of xthuy-social
 * `auto-bot-comment`). Joined-group sync reuses post-campaign.service, like the
 * source reused `post-campaign/use-groups`.
 * Posting / commenting / reacting / uploading / feeds reuse fb-post.service.
 */
import { EStorageKey } from "src/constants/enum"
import type { BotCommentIdentity } from "src/modules/automation/types/auto-bot-comment.types"
import {
  commentOnPost,
  getAdsAccessTokenCached,
  getGroupFeed,
  reactPost,
  uploadImages
} from "src/modules/facebook/services/fb-post.service"
import type { FbFeedPost } from "src/modules/facebook/types/fb-post.types"
import { getPageList } from "src/modules/inbox/services/inbox.service"
import type { IFanpage } from "src/modules/inbox/types/inbox.types"
import { chromeUtils } from "src/utils/chrome.util"

// ─── Identities (profile + Fanpages) ─────────────────────────────────────────

/** Same cache as the inbox tool (`useInboxScan`), so both share one page list. */
const PAGES_CACHE_TTL_MS = 15 * 60 * 1000

interface PagesCache {
  pages: IFanpage[]
  fetchedAt: number
}

export async function loadIdentities(
  uid: string,
  force = false
): Promise<{ identities: BotCommentIdentity[]; fetchedAt: number }> {
  if (!force) {
    const cached = await chromeUtils.getStorage<PagesCache>(
      EStorageKey.INBOX_PAGES_CACHE
    )
    if (
      cached?.pages?.length &&
      cached.pages[0]?.id === uid &&
      Date.now() - cached.fetchedAt < PAGES_CACHE_TTL_MS
    ) {
      return {
        identities: cached.pages.map(toIdentity),
        fetchedAt: cached.fetchedAt
      }
    }
  }
  const res = await getPageList(uid)
  if (!res.success || !res.data) {
    throw new Error(
      typeof res.error === "string"
        ? res.error
        : "Không tải được danh sách Fanpage"
    )
  }
  const fetchedAt = Date.now()
  await chromeUtils.setStorage<PagesCache>(EStorageKey.INBOX_PAGES_CACHE, {
    pages: res.data.pages,
    fetchedAt
  })
  return { identities: res.data.pages.map(toIdentity), fetchedAt }
}

const toIdentity = (p: IFanpage): BotCommentIdentity => ({
  id: p.id,
  name: p.name,
  type: p.type,
  avatar: p.avatar || undefined
})

// ─── Joined groups sync ──────────────────────────────────────────────────────

// ─── Runner steps ────────────────────────────────────────────────────────────

/** Latest posts of a group, minus those already handled in this round. */
export async function fetchFreshGroupPosts(
  groupId: string,
  processedKeys: Set<string>
): Promise<FbFeedPost[]> {
  const posts = await getGroupFeed(groupId, 20)
  return posts.filter((p) => !processedKeys.has(`${groupId}_${p.postId}`))
}

/** Uploads one image (as `pageId` when commenting as a Page); null on failure. */
export async function uploadCommentImage(
  image: { dataUrl: string; name: string },
  pageId: string | null
): Promise<string | null> {
  try {
    const ids = await uploadImages([image], pageId)
    return ids[0] ?? null
  } catch {
    return null
  }
}

export { commentOnPost, getAdsAccessTokenCached, reactPost }

const autoBotCommentService = {
  loadIdentities,
  fetchFreshGroupPosts,
  uploadCommentImage,
  commentOnPost,
  getAdsAccessTokenCached,
  reactPost
}
export default autoBotCommentService
