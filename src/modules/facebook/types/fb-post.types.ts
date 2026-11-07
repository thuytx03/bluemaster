/** Types for `src/modules/facebook/services/fb-post.service.ts` (ported from xthuy-social `fb-post-api.ts`). */

export interface PostToGroupParams {
  groupId: string
  content: string
  photoIds?: string[]
  videoId?: string | null
  textFormatPresetId?: string | null
  feeling?: { objectId: string; verbId: string } | null
  checkinPlaceId?: string | null
  anonymousActorId?: string | null
}

export interface PostToGroupResult {
  success: boolean
  postUrl: string
  note?: string
}

/** Result of `previewShareLink`: `shareScrapeData` is passed back to the share-link mutations. */
export interface ShareLinkPreview {
  shareScrapeData: string
  title: string
  description: string
  imageUrl: string
}

export interface FbFeedPost {
  postId: string
  groupId: string | null
  message: string
  permalink: string
  createdTime: number
  likeCount: number
  commentCount: number
  shareCount: number
  authorName: string
  imageUrl: string
}

export interface FbSourcePost {
  postId: string
  sourceId: string
  message: string
  permalink: string
  createdTime: number
  imageUrl: string
  likeCount: number
  commentCount: number
  shareCount: number
  authorName: string
}

export interface CkSearchPost {
  postId: string
  groupId: string
  authorName: string
  authorProfileUrl: string
  messageText: string
  imageUrl: string
  creationTime: number
  postUrl: string
  groupName: string
}

export interface SearchPostsPageResult {
  posts: CkSearchPost[]
  nextCursor: string | null
  hasMore: boolean
}
