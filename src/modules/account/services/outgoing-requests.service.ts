import { fetchGraphQl, parseSafe } from 'src/modules/facebook/services/fb-graphql.service';
import type {
    OutgoingRequest,
    OutgoingRequestsFetchResult,
    OutgoingRequestsPageInfo,
} from 'src/modules/account/types/outgoing-requests.types';

const DATA_GRAPHQL = {
    OUTGOING_REQUESTS_LIST: {
        name: 'FriendingCometOutgoingRequestsDialogPaginationQuery',
        docId: '9776114965832879',
        type: 'query',
    },
    OUTGOING_REQUESTS_COUNT: {
        name: 'FriendingCometOutgoingRequestsDialogQuery',
        docId: '9355113201284242',
        type: 'query',
    },
    CANCEL_REQUEST: {
        name: 'FriendingCometFriendRequestCancelMutation',
        docId: '24453541284254355',
        type: 'mutation',
    },
};

interface RequestNode {
    id?: string;
    name?: string;
    url?: string;
    profile_picture?: { uri?: string };
    social_context?: { text?: string };
}
interface RequestEdge {
    node: RequestNode;
}

/** Fetch the total number of outgoing friend requests of the user. Throws on request failure. */
export async function fetchOutgoingRequestsCount(uid: string): Promise<number> {
    const countResponse = await fetchGraphQl({
        fb_api_req_friendly_name: DATA_GRAPHQL.OUTGOING_REQUESTS_COUNT.name,
        fb_api_caller_class: 'RelayModern',
        av: uid,
        doc_id: DATA_GRAPHQL.OUTGOING_REQUESTS_COUNT.docId,
        variables: { scale: 1 },
    });
    const countParsed = parseSafe(countResponse?.data?.body);
    return countParsed?.data?.viewer?.outgoing_friend_requests_connection?.count ?? 0;
}

/**
 * Paginate outgoing friend requests starting at `cursor`, appending to `initial`.
 * `onPage` is called after every page with the accumulated list and paging info.
 */
export async function fetchOutgoingRequests({
    uid,
    cursor = null,
    initial = [],
    onPage,
}: {
    uid: string;
    cursor?: string | null;
    initial?: OutgoingRequest[];
    onPage?: (requests: OutgoingRequest[], pageInfo: OutgoingRequestsPageInfo) => void;
}): Promise<OutgoingRequestsFetchResult> {
    let currentCursor: string | null = cursor;
    let accList: OutgoingRequest[] = initial;

    while (true) {
        const response = await fetchGraphQl({
            fb_api_req_friendly_name: DATA_GRAPHQL.OUTGOING_REQUESTS_LIST.name,
            fb_api_caller_class: 'RelayModern',
            av: uid,
            doc_id: DATA_GRAPHQL.OUTGOING_REQUESTS_LIST.docId,
            variables: {
                count: 50,
                cursor: currentCursor,
                scale: 1,
            },
        });

        const parsed = parseSafe(response?.data?.body);
        const connection = parsed?.data?.viewer?.outgoing_friend_requests_connection;
        if (!connection) return { requests: accList, completed: false };

        const edges: RequestEdge[] = connection.edges || [];
        const pageInfo = connection.page_info;

        const newRequests: OutgoingRequest[] = edges.map((edge) => {
            const node = edge.node;
            return {
                id: node.id || '',
                name: node.name || 'Facebook User',
                url: node.url || '',
                profilePic: node.profile_picture?.uri || '',
                socialContext: node.social_context?.text || '',
            };
        });

        const updatedList = [...accList, ...newRequests];

        if (pageInfo?.has_next_page && pageInfo?.end_cursor) {
            onPage?.(updatedList, { hasNextPage: true, endCursor: pageInfo.end_cursor });
            currentCursor = pageInfo.end_cursor;
            accList = updatedList;
        } else {
            onPage?.(updatedList, { hasNextPage: false, endCursor: null });
            return { requests: updatedList, completed: true };
        }
    }
}

/** Cancel an outgoing friend request sent to user `id`. Returns true on success. */
export async function cancelOutgoingRequest(uid: string, id: string): Promise<boolean> {
    const response = await fetchGraphQl({
        fb_api_req_friendly_name: DATA_GRAPHQL.CANCEL_REQUEST.name,
        fb_api_caller_class: 'RelayModern',
        av: uid,
        doc_id: DATA_GRAPHQL.CANCEL_REQUEST.docId,
        variables: {
            input: {
                cancelled_friend_requestee_id: id,
                click_correlation_id: String(Date.now()),
                click_proof_validation_result: JSON.stringify({ validated: true }),
                friending_channel: 'MANAGE_OUTGOING_REQUESTS',
                actor_id: uid,
                client_mutation_id: '1',
            },
            scale: 1,
        },
    });

    const parsed = parseSafe(response?.data?.body);
    const updateData = parsed?.data?.friend_request_cancel;
    return !!updateData || (!!parsed?.data && !parsed?.errors);
}

const outgoingRequestsService = {
    fetchOutgoingRequestsCount,
    fetchOutgoingRequests,
    cancelOutgoingRequest,
};

export default outgoingRequestsService;
