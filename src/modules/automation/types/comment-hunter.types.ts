import type { CkSearchPost } from "src/modules/facebook/types/fb-post.types"

/** A post returned by the Facebook post search (same shape as the source `CkPost`). */
export type CkPost = CkSearchPost

/** An image picked by the user, kept as a data URL until it is uploaded. */
export interface CkImage {
  dataUrl: string
  name: string
  type: string
}

export type CkLogType = "info" | "success" | "error" | "warn" | "countdown"

export interface CkLogEntry {
  id: number
  text: string
  type: CkLogType
  linkUrl?: string
}

export interface CkResult {
  order: number
  postId: string
  linkUrl: string
  commentText: string
  /** Unix seconds */
  time: number
}

export type CkState = "idle" | "searching" | "running" | "done"

export type CkCategoryFilter = "all" | "group" | "page"

/** "" = everyone (no author filter). */
export type CkAuthorFilter = "" | "public" | "friends"

export interface CkProgress {
  done: number
  fail: number
  total: number
  current: number
}

export interface CkSearchOptions {
  keyword: string
  limit: number
  recentPosts: boolean
  authorFilter: CkAuthorFilter
}

export interface CkRunOptions {
  commentText: string
  posts: CkPost[]
  images: CkImage[]
  doReact: boolean
  delayMin: number
  delayMax: number
}
