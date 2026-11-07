import {
  fetchGraphQl,
  parseSafe
} from "src/modules/facebook/services/fb-graphql.service"
import {
  FriendRequest,
  FriendRequestsFetchResult,
  FriendRequestsPageInfo
} from "src/modules/account/types/friend-requests.types"

const DATA_GRAPHQL = {
  FRIEND_REQUESTS_COUNT: {
    name: "FriendingCometFriendRequestsRootQuery",
    docId: "9596167690465968",
    type: "query"
  },
  FRIEND_REQUESTS_LIST: {
    name: "FriendingCometFriendRequestsSectionPanelPaginationQuery",
    docId: "24062887186648527",
    type: "query"
  },
  CONFIRM_REQUEST: {
    name: "FriendingCometFriendRequestConfirmMutation",
    docId: "24205795295769853",
    type: "mutation"
  },
  DELETE_REQUEST: {
    name: "FriendingCometFriendRequestDeleteMutation",
    docId: "25003074442651692",
    type: "mutation"
  }
}

interface RequestNode {
  id?: string
  name?: string
  url?: string
  profile_picture?: { uri?: string }
  social_context?: { text?: string }
}

interface RequestEdge {
  node: RequestNode
  time?: number
}

/** Fetch the total number of incoming friend requests (throws on request failure). */
export async function fetchFriendRequestsCount(uid: string): Promise<number> {
  const countResponse = await fetchGraphQl({
    fb_api_req_friendly_name: DATA_GRAPHQL.FRIEND_REQUESTS_COUNT.name,
    fb_api_caller_class: "RelayModern",
    av: uid,
    doc_id: DATA_GRAPHQL.FRIEND_REQUESTS_COUNT.docId,
    variables: { scale: 1 }
  })
  const countParsed = parseSafe(countResponse?.data?.body)
  return countParsed?.data?.viewer?.friend_requests?.count ?? 0
}

/**
 * Paginate incoming friend requests starting at `cursor`, appending to `initial`.
 * `onPage` is called after each page with the accumulated list and paging info.
 */
export async function fetchFriendRequests({
  uid,
  cursor,
  initial = [],
  onPage
}: {
  uid: string
  cursor: string | null
  initial?: FriendRequest[]
  onPage?: (requests: FriendRequest[], pageInfo: FriendRequestsPageInfo) => void
}): Promise<FriendRequestsFetchResult> {
  let currentCursor = cursor
  let accList = initial

  while (true) {
    const response = await fetchGraphQl({
      fb_api_req_friendly_name: DATA_GRAPHQL.FRIEND_REQUESTS_LIST.name,
      fb_api_caller_class: "RelayModern",
      av: uid,
      doc_id: DATA_GRAPHQL.FRIEND_REQUESTS_LIST.docId,
      variables: {
        count: 20,
        cursor: currentCursor,
        scale: 1
      }
    })

    const parsed = parseSafe(response?.data?.body)
    const connection = parsed?.data?.viewer?.friending_possibilities
    if (!connection) return { requests: accList, completed: false }

    const edges: RequestEdge[] = connection.edges || []
    const pageInfo = connection.page_info

    const newRequests: FriendRequest[] = edges.map((edge) => {
      const node = edge.node
      return {
        id: node.id || "",
        name: node.name || "Facebook User",
        url: node.url || "",
        profilePic: node.profile_picture?.uri || "",
        socialContext: node.social_context?.text || "",
        time: edge.time || 0
      }
    })

    accList = accList.concat(newRequests)

    if (pageInfo?.has_next_page && pageInfo?.end_cursor) {
      onPage?.(accList, { hasNextPage: true, endCursor: pageInfo.end_cursor })
      currentCursor = pageInfo.end_cursor
    } else {
      onPage?.(accList, { hasNextPage: false, endCursor: null })
      return { requests: accList, completed: true }
    }
  }
}

/** Accept a friend request from `id`. Returns true on success. */
export async function confirmFriendRequest(
  uid: string,
  id: string
): Promise<boolean> {
  const response = await fetchGraphQl({
    fb_api_req_friendly_name: DATA_GRAPHQL.CONFIRM_REQUEST.name,
    fb_api_caller_class: "RelayModern",
    av: uid,
    doc_id: DATA_GRAPHQL.CONFIRM_REQUEST.docId,
    variables: {
      input: {
        click_correlation_id: String(Date.now()),
        click_proof_validation_result: JSON.stringify({ validated: true }),
        friend_requester_id: id,
        friending_channel: "FRIENDS_HOME_REQUESTS",
        warn_ack: false,
        actor_id: uid,
        client_mutation_id: "1"
      },
      scale: 1,
      refresh_num: 0,
      should_fix_banner: true
    }
  })

  const parsed = parseSafe(response?.data?.body)
  return !!parsed?.data && !parsed?.errors
}

/** Delete (decline) a friend request from `id`. Returns true on success. */
export async function deleteFriendRequest(
  uid: string,
  id: string
): Promise<boolean> {
  const response = await fetchGraphQl({
    fb_api_req_friendly_name: DATA_GRAPHQL.DELETE_REQUEST.name,
    fb_api_caller_class: "RelayModern",
    av: uid,
    doc_id: DATA_GRAPHQL.DELETE_REQUEST.docId,
    variables: {
      input: {
        click_correlation_id: String(Date.now()),
        click_proof_validation_result: JSON.stringify({ validated: true }),
        friend_requester_id: id,
        friending_channel: "FRIENDS_HOME_REQUESTS",
        actor_id: uid,
        client_mutation_id: "1"
      },
      scale: 1,
      refresh_num: 0
    }
  })

  const parsed = parseSafe(response?.data?.body)
  return !!parsed?.data && !parsed?.errors
}

const friendRequestsService = {
  fetchFriendRequestsCount,
  fetchFriendRequests,
  confirmFriendRequest,
  deleteFriendRequest
}

export default friendRequestsService
