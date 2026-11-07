import { useCallback, useState } from 'react';

import { CACHE_TIME } from 'src/modules/facebook/services/fb-graphql.service';
import { useTranslation } from 'react-i18next';
import { getFromLocalStorageWithExpiry, saveToLocalStorageWithExpiry } from 'src/utils/storage.util';
import { useFacebook } from 'src/modules/facebook/hooks/useFacebookSession';
import likedPagesService from 'src/modules/account/services/liked-pages.service';
import type { LikedPage } from 'src/modules/account/types/liked-pages.types';

export const useLikedPages = () => {
    const { t } = useTranslation();
    const { profile } = useFacebook();
    const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [likedPages, setLikedPages] = useState<LikedPage[]>([]);
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
                setLikedPages([]);
            }

            try {
                const uid = profile?.uid;
                const fb_dtsg = profile?.fb_dtsg;

                if (!uid || !fb_dtsg) {
                    throw new Error(t('liked_pages_error_not_logged_in'));
                }

                const cacheKey = `fb_liked_pages_${uid}`;
                if (!forceRefresh && !accumulate && cursor === null) {
                    const cachedData = getFromLocalStorageWithExpiry<LikedPage[]>(cacheKey);
                    if (cachedData !== null) {
                        setLikedPages(cachedData);
                        setState('success');
                        return;
                    }
                }

                const result = await likedPagesService.fetchLikedPages({
                    uid,
                    cursor,
                    initialList: accumulate ? likedPages : [],
                    statusLabel: t('liked_pages_status_liked'),
                    onProgress: (list, progress) => {
                        setLikedPages(list);
                        setHasNextPage(progress.hasNextPage);
                        setEndCursor(progress.endCursor);
                    },
                });

                if (result.complete) {
                    saveToLocalStorageWithExpiry(cacheKey, result.pages, CACHE_TIME.ONE_DAY);
                }
                setState('success');
            } catch (err) {
                setState('error');
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
        },
        [profile, likedPages, t],
    );

    const stop = useCallback((): void => {
        setState('idle');
    }, []);

    const unlikePage = async (id: string): Promise<boolean> => {
        const myUid = profile?.uid;
        if (!myUid) return false;

        const success = await likedPagesService.unlikePage(myUid, id);

        if (success) {
            setLikedPages((prev) => prev.filter((p) => p.id !== id));
            const cacheKey = `fb_liked_pages_${myUid}`;
            const cached = getFromLocalStorageWithExpiry<LikedPage[]>(cacheKey);
            if (cached) {
                saveToLocalStorageWithExpiry(
                    cacheKey,
                    cached.filter((p) => p.id !== id),
                    CACHE_TIME.ONE_DAY,
                );
            }
        }
        return success;
    };

    return {
        state,
        error,
        likedPages,
        hasNextPage,
        endCursor,
        load,
        stop,
        unlikePage,
    };
};
