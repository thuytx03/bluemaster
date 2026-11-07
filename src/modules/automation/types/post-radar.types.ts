/** Post collected by the radar from a group / page feed or an imported file. */
export interface RadarPost {
  postId: string
  sourceId: string
  message: string
  permalink: string
  /** Unix seconds (0 when unknown) */
  createdTime: number
  imageUrl: string
  postType: RadarPostType
  likeCount: number
  commentCount: number
  shareCount: number
  authorName: string
}

export type RadarPostType = "video" | "photo" | "text" | "link"

export type RadarSourceType = "group" | "page" | "unknown"

export interface RadarSource {
  type: RadarSourceType
  id: string
}

export interface RadarLogEntry {
  id: number
  text: string
  type: "info" | "success" | "error" | "warn" | "countdown"
  linkUrl?: string
}

export interface RadarResult {
  order: number
  postId: string
  postUrl: string
  groupName: string
  status: "ok" | "fail"
  note?: string
}

export type RadarState = "idle" | "scanning" | "running" | "done"
export type RadarTypeFilter = "all" | RadarPostType

export type RadarSortKey =
  | "createdTime"
  | "postId"
  | "likeCount"
  | "commentCount"
  | "shareCount"
export type RadarSortDir = "asc" | "desc"

/** `share` re-shares the original link, `clone` re-posts text + image as a new post. */
export type RadarPostMode = "share" | "clone"

export interface RadarTargetGroup {
  groupId: string
  groupName: string
  avatarUrl?: string
}

export interface RadarProgress {
  done: number
  fail: number
  total: number
  current: number
}

export interface RadarRunOptions {
  delayMin: number
  delayMax: number
  isAnonymous: boolean
  postMode: RadarPostMode
  cloneCaption: string
}

export interface RadarPublishResult {
  success: boolean
  postUrl: string
  note?: string
  /** Set when the group has no anonymous author (the hook translates it). */
  reason?: "no_anonymous_support"
}
