export interface LikedPage {
  id: string
  uid: string
  name: string
  avatar: string
  url: string
  category: string
  is_verified: boolean
  status: string
}

export interface LikedPageNode {
  id?: string
  name?: string
  url?: string
  category_name?: string
  is_verified?: boolean
  profile_picture?: { uri?: string }
  is_viewer_fan?: boolean
  subscribe_status?: string
}

export interface LikedPageEdge {
  node: LikedPageNode
  cursor?: string
}

export interface LikedPagesPageResult {
  data?: {
    node?: {
      id?: string
      sorted_liked_and_followed_pages?: {
        edges?: LikedPageEdge[]
        page_info?: { has_next_page?: boolean; end_cursor?: string }
      }
    }
  }
}

export interface UnlikeResult {
  data?: {
    page_unlike?: {
      page?: {
        id?: string
        is_viewer_fan?: boolean
      }
    }
  }
}

/** Paging state reported after each fetched page of liked pages. */
export interface LikedPagesProgress {
  hasNextPage: boolean
  endCursor: string | null
}

/** Result of a full liked-pages pagination run. */
export interface LikedPagesFetchResult {
  pages: LikedPage[]
  /** true when pagination reached the last page (no missing section). */
  complete: boolean
}
