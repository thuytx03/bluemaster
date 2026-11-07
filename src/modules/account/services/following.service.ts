/* eslint-disable @typescript-eslint/no-explicit-any */
import { deepFind, fetchGraphQl, getRouteDefinition, parseSafe } from 'src/modules/facebook/services/fb-graphql.service';
import type {
    FetchFollowingsResult,
    Follower,
    FollowerEdge,
    FollowingPageInfo,
    FollowingPageResult,
    FollowResult,
    UnfollowResult,
} from 'src/modules/account/types/following.types';

const DATA_GRAPHQL = {
    COUNT: {
        name: 'ProfileCometTopAppSectionQuery',
        docId: '24985464107732146',
        type: 'query',
    },
    LIST: {
        name: 'ProfileCometAppCollectionListRendererPaginationQuery',
        docId: '24702229529435057',
        type: 'query',
        defaultPageSize: 30,
        maxPageSize: 50,
    },
    UNFOLLOW: {
        name: 'CometUserUnfollowMutation',
        docId: '31783482687962030',
        type: 'mutation',
    },
    FOLLOW: {
        name: 'CometUserFollowMutation',
        docId: '27371159349185199',
        type: 'mutation',
    },
};

// ==================== COLLECTIONS ====================

const collectionCache: Record<string, any[]> = {};

/** Load (and memoize per user) every profile collection of a user, tagged with its parent tab key. */
export async function getAllCollectionIdOf(userId: string): Promise<any[]> {
    if (collectionCache[userId]?.length) {
        return collectionCache[userId];
    }
    const response = await getRouteDefinition('/' + userId);
    const nodes = deepFind(response, 'node', false) as any[];
    const collections = nodes
        ?.flatMap(
            (tab: any) =>
                tab.all_collections?.nodes?.map((collection: any) => ({
                    ...collection,
                    parent: tab.tab_key,
                })) ?? [],
        )
        .filter(Boolean);
    collectionCache[userId] = collections;
    return collectionCache[userId];
}

/** Resolve the collection id for a profile tab, falling back to the tab route's collectionToken. */
export async function getCollectionId(userId: string, tabKey: string, parent?: string): Promise<string | null> {
    const collections = await getAllCollectionIdOf(userId);
    const matched = collections?.find((c) => c.tab_key === tabKey && (!parent || c.parent === parent))?.id;
    if (matched) {
        return matched;
    }
    // bypass cache — this is the fallback path, stale cache would cause infinite null loop
    const response = await getRouteDefinition('/' + userId + '/' + tabKey, false);
    return deepFind(response, 'collectionToken') as string | null;
}

// ==================== FOLLOWING LIST ====================

function mapFollowerEdge(edge: FollowerEdge, statusLabel: string): Follower {
    const node = edge.node;
    const userNode = node?.node;
    const is_page = !node?.subtitle_text?.text;
    return {
        id: userNode?.id || node?.id || '',
        uid: userNode?.id || node?.id || '',
        name: node?.title?.text || node?.name || 'Facebook User',
        avatar: node?.image?.uri || node?.profile_picture?.uri || node?.profile_photo?.url || '',
        description: node?.subtitle_text?.text || node?.bio_text || '',
        type: is_page ? 'Page' : userNode?.__typename || userNode?.typename || node?.typename || node?.type || 'User',
        friends: node?.mutual_friends?.count?.toString() || '-',
        status: statusLabel,
    };
}

/**
 * Paginate the following collection starting at `cursor`, appending to `initial`.
 * `onPage` is called after every page with the accumulated list and the paging state.
 */
export async function fetchFollowings({
    collectionId,
    cursor = null,
    initial = [],
    statusLabel,
    onPage,
}: {
    collectionId: string;
    cursor?: string | null;
    initial?: Follower[];
    statusLabel: string;
    onPage?: (items: Follower[], pageInfo: FollowingPageInfo) => void;
}): Promise<FetchFollowingsResult> {
    let currentCursor: string | null = cursor;
    let accList: Follower[] = initial;

    while (true) {
        const res = await fetchGraphQl({
            fb_api_req_friendly_name: 'ProfileCometAppCollectionListRendererPaginationQuery',
            variables: JSON.stringify({
                count: 8,
                cursor: currentCursor,
                scale: 2,
                search: null,
                id: collectionId,
                __relay_internal__pv__FBProfile_enable_perf_improv_gkrelayprovider: true,
            }),
            doc_id: '8710009249031910',
        });

        if (!res?.ok) {
            throw new Error(res?.error || 'Failed to fetch page data');
        }
        if (!res.data?.ok) {
            throw new Error(res.data?.statusText || 'Failed to fetch page data');
        }

        const json = JSON.parse(res.data.body) as FollowingPageResult;
        const pageItems = json.data?.node?.pageItems;
        if (!pageItems) return { items: accList, completed: false };

        const edges: FollowerEdge[] = pageItems.edges ?? [];
        const pageInfo = pageItems.page_info;

        const updatedList = [...accList, ...edges.map((edge) => mapFollowerEdge(edge, statusLabel))];

        if (pageInfo?.has_next_page && pageInfo?.end_cursor) {
            onPage?.(updatedList, { hasNextPage: true, endCursor: pageInfo.end_cursor });
            currentCursor = pageInfo.end_cursor;
            accList = updatedList;
        } else {
            onPage?.(updatedList, { hasNextPage: false, endCursor: null });
            return { items: updatedList, completed: true };
        }
    }
}

// ==================== MUTATIONS ====================

/** Unfollow a profile/page; returns true when Facebook confirms the unsubscribe. */
export async function unfollowUser(myUid: string, id: string): Promise<boolean> {
    const response = await fetchGraphQl({
        fb_api_req_friendly_name: DATA_GRAPHQL.UNFOLLOW.name,
        fb_api_caller_class: 'RelayModern',
        av: myUid,
        variables: {
            action_render_location: 'WWW_COMET_FRIEND_MENU',
            input: {
                attribution_id_v2: 'ProfileCometCollectionRoot.react,comet.profile.collection.following,unexpected,,,,,',
                is_tracking_encrypted: false,
                subscribe_location: 'PROFILE',
                tracking: null,
                unsubscribee_id: id,
                actor_id: myUid,
                client_mutation_id: '1',
            },
            scale: 1,
        },
        doc_id: DATA_GRAPHQL.UNFOLLOW.docId,
    });
    const parsed = parseSafe(response?.data?.body) as UnfollowResult | null;
    const unsubscribeData = parsed?.data?.actor_unsubscribe;
    const status = unsubscribeData?.unsubscribee?.subscribe_status;
    return status === 'CAN_SUBSCRIBE' || !!unsubscribeData;
}

/** Follow a profile/page again; returns true when Facebook confirms the subscribe. */
export async function followUser(myUid: string, id: string): Promise<boolean> {
    const response = await fetchGraphQl({
        fb_api_req_friendly_name: DATA_GRAPHQL.FOLLOW.name,
        fb_api_caller_class: 'RelayModern',
        av: myUid,
        variables: {
            input: {
                attribution_id_v2: 'ProfileCometTimelineListViewRoot.react,comet.profile.timeline.list,via_cold_start,,,,,',
                is_tracking_encrypted: false,
                subscribe_location: 'PROFILE',
                subscribee_id: id,
                tracking: null,
                actor_id: myUid,
                client_mutation_id: '1',
            },
            scale: 2,
        },
        doc_id: DATA_GRAPHQL.FOLLOW.docId,
    });

    const parsed = parseSafe(response?.data?.body) as FollowResult | null;
    const subscribeData = parsed?.data?.actor_subscribe;
    const status = subscribeData?.subscribee?.subscribe_status;
    return status === 'IS_SUBSCRIBER' || status === 'IS_SUBSCRIBED' || !!subscribeData;
}

const followingService = {
    getAllCollectionIdOf,
    getCollectionId,
    fetchFollowings,
    unfollowUser,
    followUser,
};

export default followingService;
