export interface FriendRequest {
  id: string
  name: string
  url: string
  profilePic: string
  socialContext: string
  time: number // seconds timestamp
}

/** Paging info reported after each fetched page of friend requests. */
export interface FriendRequestsPageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

/** Result of paginating friend requests. */
export interface FriendRequestsFetchResult {
  requests: FriendRequest[]
  /** True when the last page was reached (false if a page returned no connection). */
  completed: boolean
}
