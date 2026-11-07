export interface Friend {
  id: string
  displayId: string
  name: string
  url: string
  profilePic: string
  gender: string
  mutualFriends: string | number
  status: string
}

export interface BlockedUser {
  id: string
  name: string
  gender: string
  profilePic: string
}

export interface RestrictedUser {
  id: string
  name: string
  gender: string
  profilePic: string
}

/** Action accepted by Facebook's BlockingSettingsBlockMutation. */
export type BlockAction = "BLOCK" | "UNBLOCK"

/** One page of a blocking-settings list (blocked / restricted / message-blocked). */
export interface BlockeesPage<T> {
  users: T[]
  hasNextPage: boolean
  endCursor: string | null
}

/** Result of walking the friends list from a cursor until the last page. */
export interface FriendsListResult {
  list: Friend[]
  /** True when the last page was reached (no next page); false when a page had no data. */
  complete: boolean
}

/** Raw friend node returned by FriendingCometFriendsListPaginationQuery. */
export interface FriendNode {
  id?: string
  name?: string
  __typename?: string
  gender?: string
  subtitle?: string
  profile_picture?: { uri?: string }
  mutual_friends?: { count?: number | string }
  url?: string
  social_context?: { text?: string }
}

export interface FriendEdge {
  node: FriendNode
}

/** Raw blockee node returned by BlockingSettingsBlockingListPaginationQuery. */
export interface BlockeeNode {
  id?: string
  name?: string
  gender?: string
  profile_picture?: { uri?: string }
}

export interface BlockeeEdge {
  node: BlockeeNode
}
