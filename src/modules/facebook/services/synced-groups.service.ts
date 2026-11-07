import { EStorageKey } from "src/constants/enum"
import { fetchAllJoinedGroups } from "src/modules/facebook/services/fb-groups.service"
import type {
  SyncedGroup,
  SyncedIdentity,
  SyncGroupInput
} from "src/modules/facebook/types/synced-groups.types"
import { chromeUtils } from "src/utils/chrome.util"

/**
 * Local store of the groups each identity (profile / Page) belongs to, kept in
 * chrome.storage.local. Replaces xthuy-social's Laravel endpoints
 * `/api/v1/extension/groups{,/sync,/identities,/identity-stats}` so bulk
 * posting / sharing work without a server.
 */

interface StoredIdentity extends Omit<SyncedIdentity, "groupCount"> {
  groups: SyncedGroup[]
}
type Store = Record<string, StoredIdentity>

const read = async (): Promise<Store> =>
  (await chromeUtils.getStorage<Store>(EStorageKey.FB_SYNCED_GROUPS)) ?? {}

/**
 * Read-modify-write under a queue so concurrent writers (a sync finishing while
 * an identity is removed, two tools syncing at once) never overwrite each other.
 */
let writeQueue: Promise<unknown> = Promise.resolve()
function mutate(change: (store: Store) => void): Promise<void> {
  const run = writeQueue.then(async () => {
    const store = await read()
    change(store)
    await chromeUtils.setStorage(EStorageKey.FB_SYNCED_GROUPS, store)
  })
  writeQueue = run.catch(() => undefined)
  return run
}

/** Every group of every identity, deduplicated by id */
function allGroups(store: Store): {
  groups: SyncedGroup[]
  lastSyncedAt: string | null
} {
  const seen = new Map<string, SyncedGroup>()
  let last: string | null = null
  for (const entry of Object.values(store)) {
    for (const g of entry.groups)
      if (!seen.has(g.groupId)) seen.set(g.groupId, g)
    if (entry.lastSyncedAt && (!last || entry.lastSyncedAt > last))
      last = entry.lastSyncedAt
  }
  return { groups: [...seen.values()], lastSyncedAt: last }
}

const toIdentity = ({ groups, ...meta }: StoredIdentity): SyncedIdentity => ({
  ...meta,
  groupCount: groups.length
})

/** Identities that have at least one sync, profile first. */
export async function listIdentities(): Promise<SyncedIdentity[]> {
  const store = await read()
  return Object.values(store)
    .map(toIdentity)
    .sort((a, b) =>
      a.type === b.type
        ? a.name.localeCompare(b.name)
        : a.type === "profile"
          ? -1
          : 1
    )
}

/** Groups of one identity, or of every identity (deduplicated) when `uid` is omitted. */
export async function getGroups(
  uid?: string
): Promise<{ groups: SyncedGroup[]; lastSyncedAt: string | null }> {
  const store = await read()
  if (uid)
    return {
      groups: store[uid]?.groups ?? [],
      lastSyncedAt: store[uid]?.lastSyncedAt ?? null
    }
  return allGroups(store)
}

/**
 * Replaces the stored groups of `uid` with `groups` (a full re-sync).
 * `meta` fills in the identity's name / avatar / type the first time it is seen.
 */
export async function syncGroups(
  uid: string,
  groups: SyncGroupInput[],
  meta?: Partial<Pick<SyncedIdentity, "name" | "avatar" | "type">>
): Promise<void> {
  const unique = new Map<string, SyncedGroup>()
  for (const g of groups) {
    if (!g.id || unique.has(g.id)) continue
    unique.set(g.id, {
      groupId: g.id,
      groupName: g.name,
      avatarUrl: g.avatar || undefined,
      memberCount: g.member_count || undefined,
      privacy: g.privacy || undefined
    })
  }
  await mutate((store) => {
    const prev = store[uid]
    store[uid] = {
      uid,
      name: meta?.name ?? prev?.name ?? uid,
      avatar: meta?.avatar ?? prev?.avatar,
      type: meta?.type ?? prev?.type ?? "profile",
      lastSyncedAt: new Date().toISOString(),
      groups: [...unique.values()]
    }
  })
}

/** Group counts per identity (replaces the identity-stats endpoint). */
export async function getIdentityStats(): Promise<{
  counts: Record<string, number>
  totalGroups: number
}> {
  const store = await read()
  const counts: Record<string, number> = {}
  for (const [uid, entry] of Object.entries(store))
    counts[uid] = entry.groups.length
  return { counts, totalGroups: allGroups(store).groups.length }
}

export async function removeIdentity(uid: string): Promise<void> {
  await mutate((store) => {
    delete store[uid]
  })
}

/**
 * Fetches the profile's joined groups from Facebook and replaces its stored
 * list. Nothing is written when the fetch is incomplete (it throws instead).
 * Resolves to the number of groups stored.
 */
export async function syncJoinedGroups(
  profile: { uid: string; name?: string; avatar?: string },
  onProgress?: (count: number) => void
): Promise<number> {
  const groups = await fetchAllJoinedGroups(profile.uid, onProgress)
  await syncGroups(profile.uid, groups, {
    name: profile.name,
    avatar: profile.avatar,
    type: "profile"
  })
  return groups.length
}

const syncedGroupsService = {
  listIdentities,
  getGroups,
  syncGroups,
  syncJoinedGroups,
  getIdentityStats,
  removeIdentity
}
export default syncedGroupsService
