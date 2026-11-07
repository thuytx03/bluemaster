import type {
  SyncedGroup,
  SyncedIdentity
} from "src/modules/facebook/types/synced-groups.types"

export type { SyncedGroup, SyncedIdentity }

/** An identity added to the "share destinations" list with its group selection. */
export interface SelectedIdentityRow {
  identity: SyncedIdentity
  allGroups: SyncedGroup[]
  selectedGroups: SyncedGroup[]
  loadingGroups: boolean
  shareToTimeline: boolean
}

export interface LinkPreview {
  title: string
  description: string
  imageUrl?: string
}

/** Result of `previewLink`: `shareScrapeData` is reused by every share of the run. */
export interface MaxPowerSharePreview extends LinkPreview {
  shareScrapeData: string
}

export interface GroupTarget {
  groupId: string
  groupName: string
  identityName?: string
  /** Identity that shares into this group: a Page id, or the profile uid */
  identityUid?: string
  identityType?: "profile" | "page"
}

export interface MaxPowerShareConfig {
  /** Link of the post / marketplace item / reel to share */
  shareUrl: string
  /** Destination groups */
  groups: GroupTarget[]
  /** Identities that also share to their own timeline */
  shareToTimelines: { uid: string; name: string; type: "profile" | "page" }[]
  /** Caption, posted as written; `a | b | c` picks one alternative per share */
  content: string
  /** Seconds */
  delayMin: number
  /** Seconds */
  delayMax: number
  /** Rest after every N successful groups (0 = never) */
  restAfterGroups: number
  restMinutes: number
}

export interface ShareLog {
  groupId: string
  groupName: string
  identityName: string
  ok: boolean
  msg: string
  postUrl: string
  ts: string
}

export interface ShareResult {
  ok: boolean
  postUrl: string
  error?: string
}

export interface MaxPowerShareProgress {
  current: number
  total: number
  success: number
  fail: number
}

export type MaxPowerShareRunState =
  | "idle"
  | "running"
  | "paused"
  | "done"
  | "error"

export type ShareLogFilter = "all" | "success" | "fail"
