import {
  delay,
  fetchGraphQl,
  parseSafe
} from "src/modules/facebook/services/fb-graphql.service"
import type { SyncGroupInput } from "src/modules/facebook/types/synced-groups.types"

const JOINED_GROUPS_DOC_ID = "6009728632468556"
const PAGE_SIZE = 50
const MAX_PAGES = 200

/** Thrown when Facebook stops answering mid-way, so callers never store a partial list as complete. */
export class IncompleteGroupsError extends Error {
  constructor(
    public readonly fetched: number,
    reason: string
  ) {
    super(`Joined-groups sync stopped after ${fetched} groups: ${reason}`)
    this.name = "IncompleteGroupsError"
  }
}

/**
 * Every group the logged-in profile has joined (GroupsCometAllJoinedGroupsSectionPaginationQuery,
 * 50 per page). The single implementation behind every "sync groups" button.
 * Throws `IncompleteGroupsError` if a page fails or cannot be parsed.
 */
export async function fetchAllJoinedGroups(
  uid: string,
  onProgress?: (count: number) => void
): Promise<SyncGroupInput[]> {
  const all: SyncGroupInput[] = []
  let cursor: string | null = null

  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetchGraphQl({
      av: uid,
      __user: uid,
      __a: "1",
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name:
        "GroupsCometAllJoinedGroupsSectionPaginationQuery",
      variables: JSON.stringify({
        count: PAGE_SIZE,
        cursor,
        ordering: ["integrity_signals"],
        scale: 1
      }),
      server_timestamps: "true",
      doc_id: JOINED_GROUPS_DOC_ID
    })
    if (!res?.ok || !res.data?.ok) {
      throw new IncompleteGroupsError(
        all.length,
        res?.error ?? `HTTP ${res?.data?.status ?? "?"}`
      )
    }
    const list = parseSafe(res.data.body, {})?.data?.viewer?.all_joined_groups
      ?.tab_groups_list
    if (!list)
      throw new IncompleteGroupsError(all.length, "unexpected response")

    for (const e of (list.edges ?? []) as {
      node?: {
        __typename?: string
        id?: string
        name?: string
        profile_picture?: { uri?: string }
      }
    }[]) {
      const n = e.node
      if (n?.__typename !== "Group" || !n.id) continue
      all.push({
        id: n.id,
        name: n.name ?? "",
        avatar: n.profile_picture?.uri ?? ""
      })
    }
    onProgress?.(all.length)

    const next: string | undefined = list.page_info?.has_next_page
      ? list.page_info?.end_cursor
      : undefined
    if (!next || next === cursor) return all
    cursor = next
    await delay(300)
  }
  return all
}
