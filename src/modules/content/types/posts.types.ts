import type { BulkState } from "src/modules/facebook/types/bulk.types"

/** Classification of a timeline story (source: `Post.type`). */
export type PostType = "share" | "own" | "tagged"

/** Normalised audience; anything not matched by the label heuristics is `CUSTOM`. */
export type PostPrivacy = "EVERYONE" | "FRIENDS" | "ONLY_ME" | "CUSTOM"

/**
 * One story of the "Manage posts" feed.
 * The source also stored a translated `typeLabel`; labels are now derived from
 * `type` in the UI so the service stays free of i18n.
 */
export interface Post {
  storyId: string
  message: string | null
  url: string
  privacy: PostPrivacy | string
  /** Raw audience label as Facebook renders it (e.g. "Công khai"), or "Unknown". */
  privacyLabel: string
  /** Unix seconds */
  creationTime: number
  attachments: Array<{ imageUri: string }>
  canDelete: boolean
  type: PostType
}

export type PostAction = "delete" | "hide" | "untag" | "archive" | "trash"

/** Story-curation actions sent through ProfileCometBulkStoryCurationMutation. */
export type StoryCurationAction = "DELETE" | "HIDE_FROM_TIMELINE" | "UNTAG"

export type PostsBulkState = BulkState<PostAction>

export type PostsLoadState = "idle" | "loading" | "success" | "error"

export interface PostsLoadOptions {
  cursor?: string | null
  accumulate?: boolean
  forceRefresh?: boolean
}

export interface PostsPage {
  posts: Post[]
  /** `page_info.end_cursor`, falling back to the last edge cursor. */
  nextCursor: string | null
  hasNextPage: boolean
}

export interface PostsListResult {
  list: Post[]
  /** True when the walk reached the last page (the list is safe to cache). */
  complete: boolean
}

export type PostTypeFilter = "all" | PostType
export type PostPrivacyFilter = "all" | PostPrivacy
