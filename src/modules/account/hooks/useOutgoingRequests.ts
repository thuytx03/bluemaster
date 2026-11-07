import { getFromLocalStorageWithExpiry, saveToLocalStorageWithExpiry } from 'src/utils/storage.util';
import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import { CACHE_TIME, getMyUid } from 'src/modules/facebook/services/fb-graphql.service';
import outgoingRequestsService from 'src/modules/account/services/outgoing-requests.service';
import type { OutgoingRequest } from 'src/modules/account/types/outgoing-requests.types';

export const useOutgoingRequests = () => {
    const { t } = useTranslation();
    const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [outgoingRequests, setOutgoingRequests] = useState<OutgoingRequest[]>([]);
    const [outgoingRequestsState, setOutgoingRequestsState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [outgoingRequestsTotalCount, setOutgoingRequestsTotalCount] = useState<number>(0);
    const [outgoingRequestsHasNextPage, setOutgoingRequestsHasNextPage] = useState(false);
    const [outgoingRequestsEndCursor, setOutgoingRequestsEndCursor] = useState<string | null>(null);

    const loadOutgoingRequests = useCallback(
        async ({
            cursor = null,
            accumulate = false,
            forceRefresh = false,
        }: {
            cursor: string | null;
            accumulate?: boolean;
            forceRefresh?: boolean;
        }): Promise<void> => {
            setOutgoingRequestsState('loading');
            setError(null);

            try {
                const uid = getMyUid();
                if (!uid) {
                    throw new Error(t('outgoing_requests_error_not_logged_in'));
                }

                if (cursor === null && !accumulate && !forceRefresh) {
                    const cacheKey = `fb_outgoing_requests_${uid}`;
                    const cached = getFromLocalStorageWithExpiry<{ requests: OutgoingRequest[]; totalCount: number }>(cacheKey);
                    if (cached) {
                        setOutgoingRequests(cached.requests);
                        setOutgoingRequestsTotalCount(cached.totalCount ?? cached.requests.length);
                        setOutgoingRequestsState('success');
                        setState('success');
                        return;
                    }
                }

                if (!accumulate && cursor === null) {
                    setOutgoingRequests([]);
                }

                if (cursor === null) {
                    try {
                        const count = await outgoingRequestsService.fetchOutgoingRequestsCount(uid);
                        setOutgoingRequestsTotalCount(count);
                    } catch (e) {
                        console.error('Failed to load outgoing requests count:', e);
                    }
                }

                const result = await outgoingRequestsService.fetchOutgoingRequests({
                    uid,
                    cursor,
                    initial: accumulate ? outgoingRequests : [],
                    onPage: (requests, pageInfo) => {
                        setOutgoingRequests(requests);
                        setOutgoingRequestsHasNextPage(pageInfo.hasNextPage);
                        setOutgoingRequestsEndCursor(pageInfo.endCursor);
                    },
                });

                if (result.completed) {
                    saveToLocalStorageWithExpiry(
                        `fb_outgoing_requests_${uid}`,
                        { requests: result.requests, totalCount: result.requests.length },
                        CACHE_TIME.ONE_DAY,
                    );
                }

                setOutgoingRequestsState('success');
                setState('success');
            } catch (err) {
                setOutgoingRequestsState('error');
                setState('error');
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
        },
        [outgoingRequests],
    );

    const cancelOutgoingRequest = async (id: string): Promise<boolean> => {
        const uid = getMyUid();
        if (!uid) return false;

        const success = await outgoingRequestsService.cancelOutgoingRequest(uid, id);

        if (success) {
            setOutgoingRequests((prev) => {
                const updated = prev.filter((r) => r.id !== id);
                saveToLocalStorageWithExpiry(
                    `fb_outgoing_requests_${uid}`,
                    { requests: updated, totalCount: Math.max(0, updated.length) },
                    CACHE_TIME.ONE_DAY,
                );
                return updated;
            });
            setOutgoingRequestsTotalCount((prev) => Math.max(0, prev - 1));
        }

        return success;
    };

    return {
        state,
        error,
        outgoingRequests,
        outgoingRequestsState,
        outgoingRequestsTotalCount,
        outgoingRequestsHasNextPage,
        outgoingRequestsEndCursor,
        loadOutgoingRequests,
        cancelOutgoingRequest,
    };
};
