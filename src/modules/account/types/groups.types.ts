// ==================== DOMAIN ====================

export interface JoinedGroup {
    id: string;
    uid: string;
    name: string;
    avatar: string;
    url: string;
    lastVisitedTime: number | null; // unix timestamp
    status: string;
}

export interface PendingGroup {
    id: string;
    uid: string;
    name: string;
    avatar: string;
    url: string;
    lastPostTime: number | null;
    status: string;
}

export interface SuggestedGroup {
    id: string;
    uid: string;
    name: string;
    avatar: string;
    url: string;
    snippet: string;
    status: 'idle' | 'loading' | 'success' | 'fail';
}

/** Paging snapshot reported after every fetched page. */
export interface GroupsPageProgress<T> {
    items: T[];
    hasNextPage: boolean;
    endCursor: string | null;
}

/** Final result of a paginated groups load. `completed` is true when the last page was reached. */
export interface GroupsLoadResult<T> {
    items: T[];
    completed: boolean;
}

// ==================== RAW FACEBOOK RESPONSES ====================

export interface GroupNode {
    id?: string;
    name?: string;
    url?: string;
    viewer_last_visited_time?: number;
    profile_picture?: { uri?: string };
    viewer_join_state?: string;
}

export interface GroupEdge {
    node: GroupNode;
    cursor?: string;
}

export interface GroupsPageResult {
    data?: {
        viewer?: {
            all_joined_groups?: {
                tab_groups_list?: {
                    edges?: GroupEdge[];
                    page_info?: { has_next_page?: boolean; end_cursor?: string };
                };
            };
        };
    };
}

export interface PendingGroupNode {
    id?: string;
    name?: string;
    url?: string;
    last_post_time?: number;
    profile_picture_48?: { uri?: string };
}

export interface PendingGroupEdge {
    node: PendingGroupNode;
    cursor?: string;
}

export interface PendingGroupsResponse {
    data?: {
        group_request_to_join?: {
            viewer?: {
                groups_tab?: {
                    tab_groups_list?: {
                        edges?: PendingGroupEdge[];
                        page_info?: { has_next_page?: boolean; end_cursor?: string };
                    };
                };
            };
        };
    };
}

export interface LeaveGroupResult {
    data?: {
        group_leave?: {
            group?: {
                id?: string;
                is_viewer_member?: boolean;
            };
        };
    };
}

export interface GroupSnippetNode {
    node?: {
        title?: {
            text?: string;
        };
    };
}

export interface SuggestedGroupNode {
    id?: string;
    __typename?: string;
    group?: {
        id?: string;
        url?: string;
        full_name?: string;
        cover_photo?: {
            photo?: {
                cover_image?: {
                    uri?: string;
                };
            };
        };
        group_suggested_cover_photos?: Array<{
            suggested_cover_image?: {
                uri?: string;
            };
        }>;
        group_snippets?: {
            edges?: GroupSnippetNode[];
        };
    };
}

export interface SuggestedGroupEdge {
    node: SuggestedGroupNode;
    cursor?: string | null;
}

export interface SuggestedGroupsResponse {
    data?: {
        viewer?: {
            more_suggestions?: {
                discover_tab?: {
                    units?: {
                        edges?: SuggestedGroupEdge[];
                        page_info?: {
                            has_next_page?: boolean;
                            end_cursor?: string | null;
                        };
                    };
                };
            };
        };
    };
}
