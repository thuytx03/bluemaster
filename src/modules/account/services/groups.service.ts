import { fetchGraphQl, parseSafe } from 'src/modules/facebook/services/fb-graphql.service';

import {
    GroupEdge,
    GroupsLoadResult,
    GroupsPageProgress,
    GroupsPageResult,
    JoinedGroup,
    LeaveGroupResult,
    PendingGroup,
    PendingGroupEdge,
    PendingGroupsResponse,
    SuggestedGroup,
    SuggestedGroupsResponse,
} from 'src/modules/account/types/groups.types';

const DATA_GRAPHQL = {
    JOINED_LIST: {
        name: 'GroupsCometAllJoinedGroupsSectionPaginationQuery',
        docId: '9974006939348139',
    },
    PENDING_LIST: {
        name: 'GroupsCometJoinsRootQuery',
        docId: '24648931168042404',
    },
    SUGGESTED_LIST: {
        name: 'GroupsCometCategoriesSectionMoreSuggestionsRefetchQuery',
        docId: '24184246021254836',
    },
    LEAVE: {
        name: 'useGroupLeaveMutation',
        docId: '24291433063891364',
    },
    JOIN: {
        name: 'GroupCometJoinForumMutation',
        docId: '24597623699920879',
    },
};

/** Max number of suggested groups collected before pagination stops. */
const SUGGESTED_GROUPS_LIMIT = 50;

// ==================== JOINED GROUPS ====================

/**
 * Fetches all joined groups starting at `cursor`, appending to `initial`.
 * `onPage` is called after each page with the accumulated list and paging info.
 */
export async function fetchJoinedGroups({
    cursor,
    initial = [],
    statusLabel,
    onPage,
}: {
    cursor: string | null;
    initial?: JoinedGroup[];
    statusLabel: string;
    onPage?: (progress: GroupsPageProgress<JoinedGroup>) => void;
}): Promise<GroupsLoadResult<JoinedGroup>> {
    const fetchPage = async (currentCursor: string | null, accList: JoinedGroup[]): Promise<GroupsLoadResult<JoinedGroup>> => {
        const res = await fetchGraphQl({
            fb_api_req_friendly_name: DATA_GRAPHQL.JOINED_LIST.name,
            variables: JSON.stringify({
                count: 20,
                cursor: currentCursor,
                ordering: ['viewer_added_first'],
                scale: 1,
            }),
            doc_id: DATA_GRAPHQL.JOINED_LIST.docId,
        });

        if (!res?.ok) {
            throw new Error(res?.error || 'Failed to fetch groups data');
        }
        if (!res.data?.ok) {
            throw new Error(res.data?.statusText || 'Failed to fetch groups data');
        }

        const json = JSON.parse(res.data.body) as GroupsPageResult;
        const listSection = json.data?.viewer?.all_joined_groups?.tab_groups_list;
        if (!listSection) return { items: accList, completed: false };

        const edges: GroupEdge[] = listSection.edges ?? [];
        const pageInfo = listSection.page_info;

        const newGroups: JoinedGroup[] = edges.map((edge) => {
            const node = edge.node;
            return {
                id: node.id || '',
                uid: node.id || '',
                name: node.name || 'Facebook Group',
                avatar: node.profile_picture?.uri || '',
                url: node.url || `https://facebook.com/groups/${node.id}`,
                lastVisitedTime: node.viewer_last_visited_time || null,
                status: statusLabel,
            };
        });

        const updatedList = [...accList, ...newGroups];

        if (pageInfo?.has_next_page && pageInfo?.end_cursor) {
            onPage?.({ items: updatedList, hasNextPage: true, endCursor: pageInfo.end_cursor });
            return fetchPage(pageInfo.end_cursor, updatedList);
        }
        onPage?.({ items: updatedList, hasNextPage: false, endCursor: null });
        return { items: updatedList, completed: true };
    };

    return fetchPage(cursor, initial);
}

// ==================== PENDING GROUPS ====================

/**
 * Fetches groups the viewer has requested to join, appending (deduplicated) to `initial`.
 * `onPage` is called after each page with the accumulated list and paging info.
 */
export async function fetchPendingGroups({
    cursor,
    initial = [],
    statusLabel,
    onPage,
}: {
    cursor: string | null;
    initial?: PendingGroup[];
    statusLabel: string;
    onPage?: (progress: GroupsPageProgress<PendingGroup>) => void;
}): Promise<GroupsLoadResult<PendingGroup>> {
    const fetchPage = async (currentCursor: string | null, accList: PendingGroup[]): Promise<GroupsLoadResult<PendingGroup>> => {
        const res = await fetchGraphQl({
            fb_api_req_friendly_name: DATA_GRAPHQL.PENDING_LIST.name,
            variables: JSON.stringify({
                ...(currentCursor ? { cursor: currentCursor } : {}),
                ordering: ['viewer_added'],
                scale: 1,
            }),
            doc_id: DATA_GRAPHQL.PENDING_LIST.docId,
        });

        if (!res?.ok) {
            throw new Error(res?.error || 'Failed to fetch pending groups');
        }
        if (!res.data?.ok) {
            throw new Error(res.data?.statusText || 'Failed to fetch pending groups');
        }

        const json = JSON.parse(res.data.body) as PendingGroupsResponse;
        const listSection = json.data?.group_request_to_join?.viewer?.groups_tab?.tab_groups_list;
        if (!listSection) return { items: accList, completed: false };

        const edges: PendingGroupEdge[] = listSection.edges ?? [];
        const pageInfo = listSection.page_info;

        const newGroups: PendingGroup[] = edges.map((edge) => {
            const node = edge.node;
            return {
                id: node.id || '',
                uid: node.id || '',
                name: node.name || 'Facebook Group',
                avatar: node.profile_picture_48?.uri || '',
                url: node.url || `https://facebook.com/groups/${node.id}`,
                lastPostTime: node.last_post_time || null,
                status: statusLabel,
            };
        });

        const updatedList = [...accList, ...newGroups];

        // Deduplicate
        const uniqueList = updatedList.filter((item, index, self) => self.findIndex((g) => g.id === item.id) === index);

        // Stop when a page brings nothing new: the xthuy-social original never sent
        // the cursor, so Facebook kept returning page 1 and this recursed forever.
        if (pageInfo?.has_next_page && pageInfo?.end_cursor && uniqueList.length > accList.length) {
            onPage?.({ items: uniqueList, hasNextPage: true, endCursor: pageInfo.end_cursor });
            return fetchPage(pageInfo.end_cursor, uniqueList);
        }
        onPage?.({ items: uniqueList, hasNextPage: false, endCursor: null });
        return { items: uniqueList, completed: true };
    };

    return fetchPage(cursor, initial);
}

// ==================== SUGGESTED GROUPS ====================

/**
 * Fetches suggested groups (up to ~50) starting at `cursor`, appending (deduplicated) to `initial`.
 * `onPage` is called after each page with the accumulated list and paging info.
 */
export async function fetchSuggestedGroups({
    cursor,
    initial = [],
    defaultGroupName,
    onPage,
}: {
    cursor: string | null;
    initial?: SuggestedGroup[];
    defaultGroupName: string;
    onPage?: (progress: GroupsPageProgress<SuggestedGroup>) => void;
}): Promise<GroupsLoadResult<SuggestedGroup>> {
    const fetchPage = async (currentCursor: string | null, accList: SuggestedGroup[]): Promise<GroupsLoadResult<SuggestedGroup>> => {
        const res = await fetchGraphQl({
            fb_api_req_friendly_name: DATA_GRAPHQL.SUGGESTED_LIST.name,
            variables: JSON.stringify({
                count: 10,
                cursor: currentCursor,
                scale: 1,
                promotion_theme: null,
                source: null,
            }),
            doc_id: DATA_GRAPHQL.SUGGESTED_LIST.docId,
        });

        if (!res?.ok) {
            throw new Error(res?.error || 'Failed to fetch suggested groups');
        }
        if (!res.data?.ok) {
            throw new Error(res.data?.statusText || 'Failed to fetch suggested groups');
        }

        const json = JSON.parse(res.data.body) as SuggestedGroupsResponse;
        const discoverTab = json.data?.viewer?.more_suggestions?.discover_tab;
        const listSection = discoverTab?.units;
        if (!listSection) return { items: accList, completed: false };

        const edges = listSection.edges ?? [];
        const pageInfo = listSection.page_info;

        // Filter only the group rows
        const newGroups: SuggestedGroup[] = edges
            .filter((edge) => edge.node?.__typename === 'GroupsTabGroupSuggestionRowUnit' && edge.node?.group)
            .map((edge) => {
                const group = edge.node.group!;
                const coverPhoto =
                    group.cover_photo?.photo?.cover_image?.uri ||
                    group.group_suggested_cover_photos?.[0]?.suggested_cover_image?.uri ||
                    '';
                const snippet = group.group_snippets?.edges?.[0]?.node?.title?.text || '';

                return {
                    id: group.id || '',
                    uid: group.id || '',
                    name: group.full_name || defaultGroupName,
                    avatar: coverPhoto,
                    url: group.url || `https://facebook.com/groups/${group.id}`,
                    snippet,
                    status: 'idle',
                };
            });

        const updatedList = [...accList, ...newGroups];

        // Deduplicate items just in case
        const uniqueList = updatedList.filter((item, index, self) => self.findIndex((g) => g.id === item.id) === index);

        // Fetch next page if exists
        if (pageInfo?.has_next_page && pageInfo?.end_cursor && uniqueList.length < SUGGESTED_GROUPS_LIMIT) {
            onPage?.({ items: uniqueList, hasNextPage: true, endCursor: pageInfo.end_cursor });
            return fetchPage(pageInfo.end_cursor, uniqueList);
        }
        onPage?.({ items: uniqueList, hasNextPage: false, endCursor: null });
        return { items: uniqueList, completed: true };
    };

    return fetchPage(cursor, initial);
}

// ==================== MUTATIONS ====================

/**
 * Leaves a group, or cancels a pending join request (same Facebook mutation).
 * Returns true when Facebook reports a `group_leave` result.
 */
export async function leaveGroup(groupId: string, myUid: string): Promise<boolean> {
    const response = await fetchGraphQl({
        fb_api_req_friendly_name: DATA_GRAPHQL.LEAVE.name,
        fb_api_caller_class: 'RelayModern',
        av: myUid,
        variables: {
            groupID: groupId,
            input: {
                action_source: 'COMET_GROUP_PAGE',
                attribution_id_v2: `GroupsCometJoinsRoot.react,comet.groups.joins,unexpected,${Date.now()},256118,,,`,
                group_id: groupId,
                readd_policy: 'ALLOW_READD',
                actor_id: myUid,
                client_mutation_id: '2',
            },
            ordering: ['viewer_added'],
            scale: 1,
        },
        doc_id: DATA_GRAPHQL.LEAVE.docId,
    });

    const parsed = parseSafe(response?.data?.body) as LeaveGroupResult | null;
    const groupLeave = parsed?.data?.group_leave;
    return groupLeave?.group?.is_viewer_member === false || !!groupLeave;
}

/**
 * Sends a join request for a suggested group.
 * Returns true when Facebook reports `group_request_to_join` or `group_join`; throws on request failure.
 */
export async function joinGroup(groupId: string, myUid: string): Promise<boolean> {
    const response = await fetchGraphQl({
        fb_api_req_friendly_name: DATA_GRAPHQL.JOIN.name,
        fb_api_caller_class: 'RelayModern',
        av: myUid,
        variables: {
            feedType: 'DISCUSSION',
            groupID: groupId,
            input: {
                action_source: 'GROUPS_DISCOVER_TAB',
                attribution_id_v2: `GroupsCometDiscoverRoot.react,comet.groups.discover,unexpected,${Date.now()},78574,,,`,
                group_id: groupId,
                group_share_tracking_params: null,
                actor_id: myUid,
                client_mutation_id: '1',
            },
            inviteShortLinkKey: null,
            scale: 1,
        },
        doc_id: DATA_GRAPHQL.JOIN.docId,
    });

    const parsed = parseSafe(response?.data?.body);

    // Check if group_request_to_join or group_join exists, indicating success
    return !!parsed?.data?.group_request_to_join || !!parsed?.data?.group_join;
}

const groupsService = {
    fetchJoinedGroups,
    fetchPendingGroups,
    fetchSuggestedGroups,
    leaveGroup,
    joinGroup,
};

export default groupsService;
