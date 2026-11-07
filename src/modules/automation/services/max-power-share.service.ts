import type {
  MaxPowerSharePreview,
  ShareResult,
  SyncedGroup,
  SyncedIdentity
} from "src/modules/automation/types/max-power-share.types"
import {
  postShareLinkToGroup,
  postShareLinkToTimeline,
  previewShareLink
} from "src/modules/facebook/services/fb-post.service"
import {
  getGroups,
  getIdentityStats,
  listIdentities
} from "src/modules/facebook/services/synced-groups.service"
import { getPageList } from "src/modules/inbox/services/inbox.service"

interface ProfileLike {
  uid: string
  name?: string
  avatar?: string
}

/**
 * Identities for the picker: the current profile + its Fanpages (from
 * `getPageList`), each with its locally synced group count, followed by any
 * other identity that has synced groups stored in this browser.
 * Replaces the Laravel `/api/v1/extension/groups/identities` endpoint.
 */
export async function fetchIdentities(
  profile: ProfileLike
): Promise<SyncedIdentity[]> {
  const [{ counts }, stored, pageRes] = await Promise.all([
    getIdentityStats(),
    listIdentities(),
    getPageList(profile.uid).catch(() => null)
  ])

  const result: SyncedIdentity[] = []
  const seen = new Set<string>()
  const push = (identity: SyncedIdentity) => {
    if (!identity.uid || seen.has(identity.uid)) return
    seen.add(identity.uid)
    result.push(identity)
  }
  const storedById = new Map(stored.map((s) => [s.uid, s]))

  push({
    uid: profile.uid,
    name: profile.name || storedById.get(profile.uid)?.name || profile.uid,
    avatar: profile.avatar || storedById.get(profile.uid)?.avatar,
    type: "profile",
    groupCount: counts[profile.uid] ?? 0,
    lastSyncedAt: storedById.get(profile.uid)?.lastSyncedAt ?? null
  })

  for (const page of pageRes?.success ? pageRes.data?.pages ?? [] : []) {
    push({
      uid: page.id,
      name: page.name || page.id,
      avatar: page.avatar || undefined,
      type: page.type,
      groupCount: counts[page.id] ?? 0,
      lastSyncedAt: storedById.get(page.id)?.lastSyncedAt ?? null
    })
  }

  for (const identity of stored) push(identity)

  return result
}

/** All locally synced groups of one identity (replaces `/api/v1/extension/groups?uid=`). */
export async function fetchGroupsForIdentity(
  uid: string
): Promise<SyncedGroup[]> {
  return (await getGroups(uid)).groups
}

/** Link preview + `share_scrape_data`; null when Facebook gives nothing back. */
export async function previewLink(
  url: string
): Promise<MaxPowerSharePreview | null> {
  try {
    const result = await previewShareLink(url)
    if (!result) return null
    return {
      shareScrapeData: result.shareScrapeData,
      title: result.title,
      description: result.description,
      imageUrl: result.imageUrl
    }
  } catch {
    return null
  }
}

/** Shares the link into one group; never throws. */
export async function shareToGroup(
  groupId: string,
  content: string,
  shareLinkUrl: string,
  shareScrapeData: string | null,
  /** Share as this Page; omitted = the profile */
  pageId?: string | null
): Promise<ShareResult> {
  try {
    const result = await postShareLinkToGroup({
      groupId,
      content,
      shareLinkUrl,
      shareScrapeData,
      pageId
    })
    return { ok: result.success, postUrl: result.postUrl, error: result.note }
  } catch (e) {
    return { ok: false, postUrl: "", error: String((e as Error)?.message ?? e) }
  }
}

/** Shares the link to the logged-in profile's timeline; never throws. */
export async function shareToTimeline(
  content: string,
  shareLinkUrl: string,
  shareScrapeData: string | null,
  /** Post on this Page's timeline; omitted = the profile */
  pageId?: string | null
): Promise<ShareResult> {
  try {
    const result = await postShareLinkToTimeline({
      content,
      shareLinkUrl,
      shareScrapeData,
      pageId
    })
    return { ok: result.success, postUrl: result.postUrl, error: result.note }
  } catch (e) {
    return { ok: false, postUrl: "", error: String((e as Error)?.message ?? e) }
  }
}

const maxPowerShareService = {
  fetchIdentities,
  fetchGroupsForIdentity,
  previewLink,
  shareToGroup,
  shareToTimeline
}

export default maxPowerShareService
