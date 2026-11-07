export interface Follower {
    id: string;
    name: string;
    uid: string;
    avatar: string;
    description: string;
    type: string;
    friends: string;
    status: string;
}

export interface FollowerNode {
    id?: string;
    name?: string;
    typename?: string;
    type?: string;
    title?: { text?: string };
    profile_picture?: { uri?: string };
    profile_photo?: { url?: string };
    image?: { uri?: string };
    subtitle_text?: { text?: string };
    bio_text?: string;
    mutual_friends?: { count?: number | string };
    node?: {
        id?: string;
        __typename?: string;
        typename?: string;
    };
}

export interface FollowerEdge {
    node: FollowerNode;
}

export interface FollowingPageResult {
    data?: {
        node?: {
            pageItems?: {
                edges?: FollowerEdge[];
                page_info?: { has_next_page?: boolean; end_cursor?: string };
            };
        };
    };
}

export interface UnfollowResult {
    data?: {
        actor_unsubscribe?: {
            unsubscribee?: { subscribe_status?: string };
        };
    };
}

export interface FollowResult {
    data?: {
        actor_subscribe?: {
            subscribee?: { subscribe_status?: string };
        };
    };
}

/** Paging state reported after each fetched following page. */
export interface FollowingPageInfo {
    hasNextPage: boolean;
    endCursor: string | null;
}

/** Result of paginating the following collection. */
export interface FetchFollowingsResult {
    items: Follower[];
    /** true when the last page was reached (has_next_page false / no end_cursor). */
    completed: boolean;
}
