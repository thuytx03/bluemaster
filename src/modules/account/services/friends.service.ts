import {
  fetchGraphQl,
  parseSafe
} from "src/modules/facebook/services/fb-graphql.service"
import { FacebookParser } from "src/modules/facebook/utils/fb-parser.util"

import type {
  BlockAction,
  BlockedUser,
  BlockeeEdge,
  BlockeesPage,
  Friend,
  FriendEdge,
  FriendsListResult,
  RestrictedUser
} from "src/modules/account/types/friends.types"

const DATA_GRAPHQL = {
  COUNT: {
    name: "FriendingCometAllFriendsRootQuery",
    docId: "24426868700236815",
    type: "query"
  },
  LIST: {
    name: "FriendingCometFriendsListPaginationQuery",
    docId: "29498081956473146",
    type: "query",
    defaultPageSize: 30,
    maxPageSize: 50
  },
  UNFRIEND: {
    name: "FriendingCometUnfriendMutation",
    docId: "24028849793460009",
    type: "mutation"
  },
  BLOCK: {
    name: "ProfileCometActionBlockUserMutation",
    docId: "24689402130681105",
    type: "mutation"
  },
  POKE: {
    name: "PokesMutatorPokeMutation",
    docId: "29511440545169840",
    type: "mutation"
  },
  RESTRICT: {
    name: "BlockingSettingsBlockMutation",
    docId: "25850290437956165",
    type: "mutation"
  },
  BLOCK_MESSAGES: {
    name: "BlockingSettingsBlockMutation",
    docId: "25850290437956165",
    type: "mutation"
  },
  UNBLOCK: {
    name: "BlockingSettingsBlockMutation",
    docId: "25850290437956165",
    type: "mutation"
  },
  BLOCKED_LIST: {
    name: "BlockingSettingsBlockingListPaginationQuery",
    docId: "9844881652246956",
    type: "query"
  },
  ALL_FRIENDS: {
    name: "AllFriendsQuery",
    docId: "4936483286421335",
    type: "query"
  }
}

// ==================== FRIENDS LIST ====================

/** Fetch the total number of friends of the current account. */
export async function fetchFriendsCount(uid: string): Promise<number> {
  const countResponse = await fetchGraphQl({
    fb_api_req_friendly_name: DATA_GRAPHQL.COUNT.name,
    fb_api_caller_class: "RelayModern",
    av: uid,
    doc_id: DATA_GRAPHQL.COUNT.docId,
    variables: { scale: 1 }
  })
  const countParsed = parseSafe(countResponse?.data?.body)
  return countParsed?.data?.viewer?.all_friends?.count ?? 0
}

function mapFriendEdge(edge: FriendEdge): Friend {
  const node = edge.node
  const status = FacebookParser.parseStatus(node.url, node?.__typename)
  const isDeactivated = status === "Deactivated"
  return {
    url: FacebookParser.parseFacebookUrl(node.id, node.url),
    id: node.id || "",
    displayId: isDeactivated ? "N/A" : node.id || "",
    name: node.name || "Facebook User",
    profilePic: FacebookParser.parseProfilePic(node.profile_picture),
    gender: isDeactivated ? "N/A" : FacebookParser.parseGender(node.gender),
    mutualFriends: isDeactivated
      ? "-"
      : FacebookParser.parseMutualFriends(node.social_context?.text),
    status
  }
}

/**
 * Walk the friends list from `cursor` to the last page, appending to `accList`.
 * `onPage` fires after every page with the accumulated list and the next cursor (null on the last page).
 */
export async function fetchAllFriends(
  uid: string,
  cursor: string | null,
  accList: Friend[] = [],
  onPage?: (list: Friend[], nextCursor: string | null) => void
): Promise<FriendsListResult> {
  let currentCursor = cursor
  let list = accList

  while (true) {
    const response = await fetchGraphQl({
      fb_api_req_friendly_name: DATA_GRAPHQL.LIST.name,
      fb_api_caller_class: "RelayModern",
      av: uid,
      doc_id: DATA_GRAPHQL.LIST.docId,
      variables: {
        count: DATA_GRAPHQL.LIST.defaultPageSize,
        cursor: currentCursor,
        scale: 1
      }
    })

    const parsed = parseSafe(response?.data?.body)
    const allFriends = parsed?.data?.viewer?.all_friends
    if (!allFriends) return { list, complete: false }

    const edges: FriendEdge[] = allFriends.edges || []
    const pageInfo = allFriends.page_info

    list = [...list, ...edges.map(mapFriendEdge)]

    if (pageInfo?.has_next_page && pageInfo?.end_cursor) {
      onPage?.(list, pageInfo.end_cursor)
      currentCursor = pageInfo.end_cursor
    } else {
      onPage?.(list, null)
      return { list, complete: true }
    }
  }
}

// ==================== BLOCKING SETTINGS LISTS ====================

async function fetchBlockeesPage(
  uid: string,
  settingId: string,
  count: number,
  cursor: string | null,
  fallbackName: string
): Promise<BlockeesPage<BlockedUser> | null> {
  const response = await fetchGraphQl({
    fb_api_req_friendly_name: DATA_GRAPHQL.BLOCKED_LIST.name,
    fb_api_caller_class: "RelayModern",
    av: uid,
    doc_id: DATA_GRAPHQL.BLOCKED_LIST.docId,
    variables: {
      count,
      cursor: cursor,
      profile_picture_size: 50,
      id: btoa(settingId)
    }
  })

  const parsed = parseSafe(response?.data?.body)
  const blockees = parsed?.data?.node?.blockees
  if (!blockees) return null

  const edges: BlockeeEdge[] = blockees.edges || []
  const pageInfo = blockees.page_info

  const users = edges.map((edge) => {
    const node = edge.node
    return {
      id: node.id || "",
      name: node.name || fallbackName,
      gender: FacebookParser.parseGender(node.gender),
      profilePic: node.profile_picture?.uri || ""
    }
  })

  return {
    users,
    hasNextPage: pageInfo?.has_next_page || false,
    endCursor: pageInfo?.end_cursor || null
  }
}

/** Fetch one page (20) of blocked users. Returns null when Facebook returns no list. */
export function fetchBlockedUsersPage(
  uid: string,
  cursor: string | null
): Promise<BlockeesPage<BlockedUser> | null> {
  return fetchBlockeesPage(
    uid,
    "privacy_block_setting:user",
    20,
    cursor,
    "Blocked User"
  )
}

/** Fetch one page (50) of restricted users. Returns null when Facebook returns no list. */
export function fetchRestrictedUsersPage(
  uid: string,
  cursor: string | null
): Promise<BlockeesPage<RestrictedUser> | null> {
  return fetchBlockeesPage(
    uid,
    "privacy_block_setting:restricted_list",
    50,
    cursor,
    "Restricted User"
  )
}

/** Fetch one page (50) of message-blocked users. Returns null when Facebook returns no list. */
export function fetchMessageBlockedUsersPage(
  uid: string,
  cursor: string | null
): Promise<BlockeesPage<BlockedUser> | null> {
  return fetchBlockeesPage(
    uid,
    "privacy_block_setting:message",
    50,
    cursor,
    "Blocked User"
  )
}

// ==================== MUTATIONS ====================

/** Unfriend a user. Returns true when Facebook confirms `friend_remove`. */
export async function unfriendUser(uid: string, id: string): Promise<boolean> {
  const response = await fetchGraphQl({
    fb_api_req_friendly_name: DATA_GRAPHQL.UNFRIEND.name,
    fb_api_caller_class: "RelayModern",
    av: uid,
    doc_id: DATA_GRAPHQL.UNFRIEND.docId,
    variables: {
      input: {
        source: "friending_jewel",
        unfriended_user_id: id,
        actor_id: uid,
        client_mutation_id: "1"
      },
      scale: 1
    }
  })

  const parsed = parseSafe(response?.data?.body)
  return !!parsed?.data?.friend_remove
}

/** Block a user from their profile. Returns true on success. */
export async function blockUser(uid: string, id: string): Promise<boolean> {
  const response = await fetchGraphQl({
    fb_api_req_friendly_name: DATA_GRAPHQL.BLOCK.name,
    fb_api_caller_class: "RelayModern",
    av: uid,
    doc_id: DATA_GRAPHQL.BLOCK.docId,
    variables: {
      collectionID: null,
      hasCollectionAndSectionID: false,
      input: {
        blocksource: "PROFILE",
        should_apply_to_later_created_profiles: false,
        user_id: id,
        actor_id: uid,
        client_mutation_id: "3"
      },
      sectionID: null,
      isPrivacyCheckupContext: false,
      __relay_internal__pv__FBProfile_enable_perf_improv_gkrelayprovider: false,
      scale: 1
    }
  })

  const parsed = parseSafe(response?.data?.body)
  return !!parsed?.data?.user_block || (!!parsed?.data && !parsed?.errors)
}

/** Unblock a previously blocked user. Returns true on success. */
export async function unblockUser(uid: string, id: string): Promise<boolean> {
  const response = await fetchGraphQl({
    fb_api_req_friendly_name: DATA_GRAPHQL.UNBLOCK.name,
    fb_api_caller_class: "RelayModern",
    av: uid,
    doc_id: DATA_GRAPHQL.UNBLOCK.docId,
    variables: {
      input: {
        block_action: "UNBLOCK",
        setting: "USER",
        target_id: id,
        actor_id: uid,
        client_mutation_id: "4"
      },
      profile_picture_size: 36
    }
  })

  const parsed = parseSafe(response?.data?.body)
  const updateData = parsed?.data?.xfb_privacy_block_settings_update
  return (
    updateData?.block_status === "UNBLOCK" || (!!updateData && !parsed?.errors)
  )
}

/** Add (BLOCK) or remove (UNBLOCK) a user from the restricted list. Returns true on success. */
export async function setRestricted(
  uid: string,
  id: string,
  action: BlockAction
): Promise<boolean> {
  const response = await fetchGraphQl({
    fb_api_req_friendly_name: DATA_GRAPHQL.RESTRICT.name,
    fb_api_caller_class: "RelayModern",
    av: uid,
    doc_id: DATA_GRAPHQL.RESTRICT.docId,
    variables: {
      input: {
        block_action: action,
        setting: "RESTRICTED_LIST",
        target_id: id,
        actor_id: uid,
        client_mutation_id: "6"
      },
      profile_picture_size: 36
    }
  })

  const parsed = parseSafe(response?.data?.body)
  const updateData = parsed?.data?.xfb_privacy_block_settings_update
  return updateData?.block_status === action || (!!updateData && !parsed?.errors)
}

/** Block (BLOCK) or unblock (UNBLOCK) messages from a user. Returns true on success. */
export async function setMessageBlock(
  uid: string,
  id: string,
  action: BlockAction
): Promise<boolean> {
  const response = await fetchGraphQl({
    fb_api_req_friendly_name: DATA_GRAPHQL.BLOCK_MESSAGES.name,
    fb_api_caller_class: "RelayModern",
    av: uid,
    doc_id: DATA_GRAPHQL.BLOCK_MESSAGES.docId,
    variables: {
      input: {
        block_action: action,
        setting: "MESSAGE",
        target_id: id,
        actor_id: uid,
        client_mutation_id: "8"
      },
      profile_picture_size: 36
    }
  })

  const parsed = parseSafe(response?.data?.body)
  const updateData = parsed?.data?.xfb_privacy_block_settings_update
  return updateData?.block_status === action || (!!updateData && !parsed?.errors)
}

/** Poke a user. Returns true on success. */
export async function pokeUser(uid: string, id: string): Promise<boolean> {
  const response = await fetchGraphQl({
    fb_api_req_friendly_name: DATA_GRAPHQL.POKE.name,
    fb_api_caller_class: "RelayModern",
    av: uid,
    doc_id: DATA_GRAPHQL.POKE.docId,
    variables: {
      input: {
        client_mutation_id: "11",
        actor_id: uid,
        user_id: id
      },
      scale: 1
    }
  })

  const parsed = parseSafe(response?.data?.body)
  const updateData = parsed?.data?.user_poke
  return (
    updateData?.user?.poke_status === "PENDING" ||
    (!!updateData && !parsed?.errors)
  )
}

const friendsService = {
  fetchFriendsCount,
  fetchAllFriends,
  fetchBlockedUsersPage,
  fetchRestrictedUsersPage,
  fetchMessageBlockedUsersPage,
  unfriendUser,
  blockUser,
  unblockUser,
  setRestricted,
  setMessageBlock,
  pokeUser
}

export default friendsService
