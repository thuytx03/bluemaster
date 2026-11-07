import { useCallback, useState } from 'react';
import { CACHE_TIME } from 'src/modules/facebook/services/fb-graphql.service';
import { useTranslation } from 'react-i18next';
import { getFromLocalStorageWithExpiry, removeFromLocalStorage, saveToLocalStorageWithExpiry } from 'src/utils/storage.util';
import { useFacebook } from 'src/modules/facebook/hooks/useFacebookSession';
import { fetchFollowings, followUser, getCollectionId, unfollowUser } from 'src/modules/account/services/following.service';
import type { Follower } from 'src/modules/account/types/following.types';

export const useFollowing = () => {
    const { t } = useTranslation();
    const { profile } = useFacebook();
    const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [followings, setFollowings] = useState<Follower[]>([]);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [endCursor, setEndCursor] = useState<string | null>(null);

    const load = useCallback(
        async ({
            cursor = null,
            accumulate = false,
            forceRefresh = false,
        }: {
            cursor: string | null;
            accumulate?: boolean;
            forceRefresh?: boolean;
        }): Promise<void> => {
            setState('loading');
            setError(null);
            if (!accumulate && cursor === null) {
                setFollowings([]);
            }

            try {
                const uid = profile?.uid;
                const fb_dtsg = profile?.fb_dtsg;

                if (!uid || !fb_dtsg) {
                    throw new Error(t('following_error_not_logged_in'));
                }

                const cacheKey = `fb_following_${uid}`;
                if (!forceRefresh && !accumulate && cursor === null) {
                    const cachedData = getFromLocalStorageWithExpiry<Follower[]>(cacheKey);
                    if (cachedData !== null) {
                        setFollowings(cachedData);
                        setState('success');
                        return;
                    }
                }

                const collectionId = await getCollectionId(uid, 'following', 'following');
                if (!collectionId) {
                    throw new Error(t('following_error_collection_not_found'));
                }

                const { items, completed } = await fetchFollowings({
                    collectionId,
                    cursor,
                    initial: accumulate ? followings : [],
                    statusLabel: t('following_status_following'),
                    onPage: (updatedList, pageInfo) => {
                        setFollowings(updatedList);
                        setHasNextPage(pageInfo.hasNextPage);
                        setEndCursor(pageInfo.endCursor);
                    },
                });
                if (completed) {
                    saveToLocalStorageWithExpiry(cacheKey, items, CACHE_TIME.ONE_DAY); // 1 day
                }
                setState('success');
            } catch (err) {
                setState('error');
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
        },
        [profile, followings],
    );

    const stop = useCallback((): void => {
        setState('idle');
    }, []);

    const unFollowing = async (id: string): Promise<boolean> => {
        const myUid = profile?.uid;
        if (!myUid) return false;

        const success = await unfollowUser(myUid, id);
        if (success) {
            setFollowings((prev) => prev.filter((f) => f.id !== id));
            const cacheKey = `fb_following_${myUid}`;
            const cached = getFromLocalStorageWithExpiry<Follower[]>(cacheKey);
            if (cached) {
                saveToLocalStorageWithExpiry(
                    cacheKey,
                    cached.filter((f) => f.id !== id),
                    CACHE_TIME.ONE_DAY,
                );
            }
        }
        return success;
    };

    const reFollowing = async (id: string): Promise<boolean> => {
        const myUid = profile?.uid;
        if (!myUid) return false;

        const success = await followUser(myUid, id);
        if (success) {
            removeFromLocalStorage(`fb_following_${myUid}`);
        }
        return success;
    };

    return {
        state,
        error,
        followings,
        hasNextPage,
        endCursor,
        load,
        stop,
        unFollowing,
        reFollowing,
    };
};
