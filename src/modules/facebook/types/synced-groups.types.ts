/** An account the user posts as: the personal profile or one of its Pages. */
export interface SyncedIdentity {
  uid: string
  name: string
  avatar?: string
  type: "profile" | "page"
  groupCount: number
  /** ISO time of the last sync for this identity */
  lastSyncedAt?: string | null
}

export interface SyncedGroup {
  groupId: string
  groupName: string
  avatarUrl?: string
  memberCount?: string
  privacy?: string
}

/** Group as collected from Facebook before it is stored */
export interface SyncGroupInput {
  id: string
  name: string
  avatar?: string
  member_count?: string
  privacy?: string
}
