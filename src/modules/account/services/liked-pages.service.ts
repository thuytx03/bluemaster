import { fetchGraphQl, parseSafe } from "src/modules/facebook/services/fb-graphql.service"

import type {
  LikedPage,
  LikedPageEdge,
  LikedPagesFetchResult,
  LikedPagesPageResult,
  LikedPagesProgress,
  UnlikeResult
} from "src/modules/account/types/liked-pages.types"

const DATA_GRAPHQL = {
  LIST: {
    name: "PagesCometAllLikedPagesSectionPaginationQuery",
    docId: "29841836082128490",
    type: "query"
  },
  UNLIKE: {
    name: "CometProfilePlusUnlikeMutation",
    docId: "9404902679620059",
    type: "mutation"
  }
}

// ==================== LIST ====================

/**
 * Fetch all liked/followed pages of `uid`, starting at `cursor` and appending to `initialList`.
 * `onProgress` is called after each page with the accumulated list and paging state.
 * Throws on request failure.
 */
export async function fetchLikedPages({
  uid,
  cursor = null,
  initialList = [],
  statusLabel,
  onProgress
}: {
  uid: string
  cursor?: string | null
  initialList?: LikedPage[]
  /** Status label assigned to each page (translated by the caller). */
  statusLabel: string
  onProgress?: (list: LikedPage[], progress: LikedPagesProgress) => void
}): Promise<LikedPagesFetchResult> {
  let currentCursor: string | null = cursor
  let accList: LikedPage[] = initialList

  while (true) {
    const res = await fetchGraphQl({
      fb_api_req_friendly_name: DATA_GRAPHQL.LIST.name,
      variables: JSON.stringify({
        count: 20,
        id: uid,
        cursor: currentCursor,
        scale: 1,
        ranking_model: "EARLIEST_DATE_LIKED",
        __relay_internal__pv__StoriesRingrelayprovider: false
      }),
      doc_id: DATA_GRAPHQL.LIST.docId
    })

    if (!res?.ok) {
      throw new Error(res?.error || "Failed to fetch page data")
    }
    if (!res.data?.ok) {
      throw new Error(res.data?.statusText || "Failed to fetch page data")
    }

    const json = JSON.parse(res.data.body) as LikedPagesPageResult
    const section = json.data?.node?.sorted_liked_and_followed_pages
    if (!section) return { pages: accList, complete: false }

    const edges: LikedPageEdge[] = section.edges ?? []
    const pageInfo = section.page_info

    const newPages: LikedPage[] = edges.map((edge) => {
      const node = edge.node
      return {
        id: node.id || "",
        uid: node.id || "",
        name: node.name || "Facebook Page",
        avatar: node.profile_picture?.uri || "",
        url: node.url || `https://facebook.com/${node.id}`,
        category: node.category_name || "",
        is_verified: !!node.is_verified,
        status: statusLabel
      }
    })

    accList = accList.concat(newPages)

    if (pageInfo?.has_next_page && pageInfo?.end_cursor) {
      onProgress?.(accList, { hasNextPage: true, endCursor: pageInfo.end_cursor })
      currentCursor = pageInfo.end_cursor
    } else {
      onProgress?.(accList, { hasNextPage: false, endCursor: null })
      return { pages: accList, complete: true }
    }
  }
}

// ==================== MUTATIONS ====================

/** Unlike a page as `myUid`. Returns true when Facebook acknowledges the unlike. */
export async function unlikePage(myUid: string, pageId: string): Promise<boolean> {
  const response = await fetchGraphQl({
    fb_api_req_friendly_name: DATA_GRAPHQL.UNLIKE.name,
    fb_api_caller_class: "RelayModern",
    av: myUid,
    variables: {
      input: {
        is_tracking_encrypted: false,
        page_id: pageId,
        source: "page_profile",
        tracking: null,
        actor_id: myUid,
        client_mutation_id: "1"
      },
      scale: 1
    },
    doc_id: DATA_GRAPHQL.UNLIKE.docId
  })

  const parsed = parseSafe(response?.data?.body) as UnlikeResult | null
  const pageUnlike = parsed?.data?.page_unlike
  return pageUnlike?.page?.is_viewer_fan === false || !!pageUnlike
}

const likedPagesService = {
  fetchLikedPages,
  unlikePage
}

export default likedPagesService
