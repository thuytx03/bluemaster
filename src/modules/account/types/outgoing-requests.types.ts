export interface OutgoingRequest {
    id: string;
    name: string;
    url: string;
    profilePic: string;
    socialContext: string;
}

export interface OutgoingRequestsPageInfo {
    hasNextPage: boolean;
    endCursor: string | null;
}

export interface OutgoingRequestsFetchResult {
    /** Full accumulated list (initial list + every fetched page). */
    requests: OutgoingRequest[];
    /** True when the last page was reached normally (no further cursor). */
    completed: boolean;
}
