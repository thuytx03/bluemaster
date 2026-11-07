/**
 * Facebook requests for the comment-hunter tool (port of xthuy-social
 * `comment-hunter/use-comment-hunter.ts`, request parts only).
 * Search paging lives here; posting/reacting/uploading reuse fb-post.service.
 */
import type {
  CkAuthorFilter,
  CkImage,
  CkPost
} from "src/modules/automation/types/comment-hunter.types"
import {
  commentOnPost,
  reactPost,
  searchPostsPage,
  uploadImages
} from "src/modules/facebook/services/fb-post.service"

/** Search filters exactly as built by the source `searchPosts`. */
export function buildSearchFilters(
  recentPosts: boolean,
  authorFilter: CkAuthorFilter
): string[] {
  const filters: string[] = []
  if (recentPosts) filters.push('{"name":"recent_posts","args":""}')
  if (authorFilter === "public")
    filters.push('{"name":"merged_public_posts","args":""}')
  else if (authorFilter === "friends")
    filters.push(
      '{"name":"posts_from","args":"{\\"name\\":\\"posts_from\\",\\"args\\":\\"friends\\"}"}'
    )
  return filters
}

/** Consecutive pages without a new post before paging gives up. */
const MAX_STALE_PAGES = 3

/**
 * Pages through the post search until `limit` unique posts are collected.
 * Throws on request errors (the caller shows the message).
 */
export async function searchHuntPosts(
  keyword: string,
  limit: number,
  filters: string[],
  onProgress?: (found: number) => void,
  shouldStop?: () => boolean
): Promise<CkPost[]> {
  const found: CkPost[] = []
  let cursor: string | null = null
  let staleRounds = 0

  while (found.length < limit) {
    if (shouldStop?.()) break
    const res = await searchPostsPage(keyword, filters, cursor)
    if (!res.posts.length) break

    const before = found.length
    for (const p of res.posts) {
      if (!found.some((x) => x.postId === p.postId)) found.push(p)
      if (found.length >= limit) break
    }
    onProgress?.(found.length)

    // Guard against endless paging: no cursor, cursor not advancing, or a page
    // made only of posts we already have.
    if (!res.hasMore || !res.nextCursor || res.nextCursor === cursor) break
    staleRounds = found.length === before ? staleRounds + 1 : 0
    if (staleRounds >= MAX_STALE_PAGES) break
    cursor = res.nextCursor
  }

  return found
}

/** Uploads one image for a comment; returns the photo id or null. */
export async function uploadCommentImage(
  image: CkImage
): Promise<string | null> {
  const ids = await uploadImages([image])
  return ids?.[0] ?? null
}

export async function reactHuntPost(post: CkPost): Promise<void> {
  await reactPost(post.postId, post.groupId)
}

export async function commentHuntPost(
  post: CkPost,
  text: string,
  photoId: string | null
): Promise<void> {
  await commentOnPost(post.postId, post.groupId, text, photoId)
}

export default {
  buildSearchFilters,
  searchHuntPosts,
  uploadCommentImage,
  reactHuntPost,
  commentHuntPost
}
