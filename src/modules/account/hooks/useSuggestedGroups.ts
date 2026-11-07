import { useCallback, useState } from 'react';

import { CACHE_TIME } from 'src/modules/facebook/services/fb-graphql.service';
import { useTranslation } from 'react-i18next';
import { getFromLocalStorageWithExpiry, saveToLocalStorageWithExpiry } from 'src/utils/storage.util';
import { useFacebook } from 'src/modules/facebook/hooks/useFacebookSession';
import groupsService from 'src/modules/account/services/groups.service';
import { SuggestedGroup } from 'src/modules/account/types/groups.types';

export const useSuggestedGroups = () => {
    const { t } = useTranslation();
    const { profile } = useFacebook();
    const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [suggestedGroups, setSuggestedGroups] = useState<SuggestedGroup[]>([]);
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
                setSuggestedGroups([]);
            }

            try {
                const uid = profile?.uid;
                const fb_dtsg = profile?.fb_dtsg;

                if (!uid || !fb_dtsg) {
                    throw new Error(t('suggested_groups_not_logged_in_or_loading'));
                }

                const cacheKey = `fb_suggested_groups_${uid}`;
                if (!forceRefresh && !accumulate && cursor === null) {
                    const cachedData = getFromLocalStorageWithExpiry<SuggestedGroup[]>(cacheKey);
                    if (cachedData !== null) {
                        setSuggestedGroups(cachedData);
                        setState('success');
                        return;
                    }
                }

                const result = await groupsService.fetchSuggestedGroups({
                    cursor,
                    initial: accumulate ? suggestedGroups : [],
                    defaultGroupName: t('suggested_groups_default_group_name'),
                    onPage: (page) => {
                        setSuggestedGroups(page.items);
                        setHasNextPage(page.hasNextPage);
                        setEndCursor(page.endCursor);
                    },
                });
                if (result.completed) {
                    saveToLocalStorageWithExpiry(cacheKey, result.items, CACHE_TIME.ONE_HOUR);
                }
                setState('success');
            } catch (err) {
                setState('error');
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
        },
        [profile, suggestedGroups, t],
    );

    const joinGroup = async (id: string): Promise<boolean> => {
        const myUid = profile?.uid;
        if (!myUid) return false;

        try {
            const success = await groupsService.joinGroup(id, myUid);

            if (success) {
                setSuggestedGroups((prev) => prev.map((g) => (g.id === id ? { ...g, status: 'success' } : g)));
                // Also update the cache
                const cacheKey = `fb_suggested_groups_${myUid}`;
                const cached = getFromLocalStorageWithExpiry<SuggestedGroup[]>(cacheKey);
                if (cached) {
                    saveToLocalStorageWithExpiry(
                        cacheKey,
                        cached.map((g) => (g.id === id ? { ...g, status: 'success' } : g)),
                        CACHE_TIME.ONE_HOUR,
                    );
                }
            }
            return success;
        } catch (err) {
            console.error('Error joining group:', err);
            return false;
        }
    };

    return {
        state,
        error,
        suggestedGroups,
        hasNextPage,
        endCursor,
        load,
        joinGroup,
    };
};
