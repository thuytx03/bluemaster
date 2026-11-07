import { getFromLocalStorageWithExpiry, saveToLocalStorageWithExpiry } from 'src/utils/storage.util';
import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import { CACHE_TIME, getMyUid } from 'src/modules/facebook/services/fb-graphql.service';
import friendRequestsService from 'src/modules/account/services/friend-requests.service';
import { FriendRequest } from 'src/modules/account/types/friend-requests.types';

export const useFriendRequests = () => {
    const { t } = useTranslation();
    const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [friendRequestsState, setFriendRequestsState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [friendRequestsTotalCount, setFriendRequestsTotalCount] = useState<number>(0);
    const [friendRequestsHasNextPage, setFriendRequestsHasNextPage] = useState(false);
    const [friendRequestsEndCursor, setFriendRequestsEndCursor] = useState<string | null>(null);

    const loadFriendRequests = useCallback(
        async ({
            cursor = null,
            accumulate = false,
            forceRefresh = false,
        }: {
            cursor: string | null;
            accumulate?: boolean;
            forceRefresh?: boolean;
        }): Promise<void> => {
            setFriendRequestsState('loading');
            setError(null);

            try {
                const uid = getMyUid();
                if (!uid) {
                    throw new Error(t('friend_requests_error_not_logged_in'));
                }

                if (cursor === null && !accumulate && !forceRefresh) {
                    const cacheKey = `fb_friend_requests_${uid}`;
                    const cached = getFromLocalStorageWithExpiry<{ requests: FriendRequest[]; totalCount: number }>(cacheKey);
                    if (cached) {
                        setFriendRequests(cached.requests);
                        setFriendRequestsTotalCount(cached.totalCount ?? cached.requests.length);
                        setFriendRequestsState('success');
                        setState('success');
                        return;
                    }
                }

                if (!accumulate && cursor === null) {
                    setFriendRequests([]);
                }

                if (cursor === null) {
                    try {
                        const count = await friendRequestsService.fetchFriendRequestsCount(uid);
                        setFriendRequestsTotalCount(count);
                    } catch (e) {
                        console.error('Failed to load friend requests count:', e);
                    }
                }

                const result = await friendRequestsService.fetchFriendRequests({
                    uid,
                    cursor,
                    initial: accumulate ? friendRequests : [],
                    onPage: (list, pageInfo) => {
                        setFriendRequests(list);
                        setFriendRequestsHasNextPage(pageInfo.hasNextPage);
                        setFriendRequestsEndCursor(pageInfo.endCursor);
                    },
                });

                if (result.completed) {
                    saveToLocalStorageWithExpiry(
                        `fb_friend_requests_${uid}`,
                        { requests: result.requests, totalCount: result.requests.length },
                        CACHE_TIME.ONE_DAY,
                    );
                }

                setFriendRequestsState('success');
                setState('success');
            } catch (err) {
                setFriendRequestsState('error');
                setState('error');
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
        },
        [friendRequests],
    );

    const removeRequestLocally = (uid: string, id: string) => {
        setFriendRequests((prev) => {
            const updated = prev.filter((r) => r.id !== id);
            saveToLocalStorageWithExpiry(
                `fb_friend_requests_${uid}`,
                { requests: updated, totalCount: Math.max(0, updated.length) },
                CACHE_TIME.ONE_DAY,
            );
            return updated;
        });
        setFriendRequestsTotalCount((prev) => Math.max(0, prev - 1));
    };

    const confirmFriendRequest = async (id: string): Promise<boolean> => {
        const uid = getMyUid();
        if (!uid) return false;

        const success = await friendRequestsService.confirmFriendRequest(uid, id);
        if (success) removeRequestLocally(uid, id);

        return success;
    };

    const deleteFriendRequest = async (id: string): Promise<boolean> => {
        const uid = getMyUid();
        if (!uid) return false;

        const success = await friendRequestsService.deleteFriendRequest(uid, id);
        if (success) removeRequestLocally(uid, id);

        return success;
    };

    return {
        state,
        error,
        friendRequests,
        friendRequestsState,
        friendRequestsTotalCount,
        friendRequestsHasNextPage,
        friendRequestsEndCursor,
        loadFriendRequests,
        confirmFriendRequest,
        deleteFriendRequest,
    };
};
