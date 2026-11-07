import { getFromLocalStorageWithExpiry, saveToLocalStorageWithExpiry } from 'src/utils/storage.util';
import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import { useFacebook } from 'src/modules/facebook/hooks/useFacebookSession';
import { CACHE_TIME } from 'src/modules/facebook/services/fb-graphql.service';
import groupsService from 'src/modules/account/services/groups.service';
import { JoinedGroup } from 'src/modules/account/types/groups.types';

export const useGroups = () => {
    const { profile } = useFacebook();
    const { t } = useTranslation();
    const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [groups, setGroups] = useState<JoinedGroup[]>([]);
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
                setGroups([]);
            }

            try {
                const uid = profile?.uid;
                const fb_dtsg = profile?.fb_dtsg;

                if (!uid || !fb_dtsg) {
                    throw new Error(t('groups_panel_not_logged_in_or_loading'));
                }

                const cacheKey = `fb_joined_groups_${uid}`;
                if (!forceRefresh && !accumulate && cursor === null) {
                    const cachedData = getFromLocalStorageWithExpiry<JoinedGroup[]>(cacheKey);
                    if (cachedData !== null) {
                        setGroups(cachedData);
                        setState('success');
                        return;
                    }
                }

                const result = await groupsService.fetchJoinedGroups({
                    cursor,
                    initial: accumulate ? groups : [],
                    statusLabel: t('groups_panel_status_member'),
                    onPage: (page) => {
                        setGroups(page.items);
                        setHasNextPage(page.hasNextPage);
                        setEndCursor(page.endCursor);
                    },
                });
                if (result.completed) {
                    saveToLocalStorageWithExpiry(cacheKey, result.items, CACHE_TIME.ONE_DAY);
                }
                setState('success');
            } catch (err) {
                setState('error');
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
        },
        [profile, groups],
    );

    const stop = useCallback((): void => {
        setState('idle');
    }, []);

    const leaveGroup = async (id: string): Promise<boolean> => {
        const myUid = profile?.uid;
        if (!myUid) return false;

        const success = await groupsService.leaveGroup(id, myUid);

        if (success) {
            setGroups((prev) => prev.filter((g) => g.id !== id));
            const cacheKey = `fb_joined_groups_${myUid}`;
            const cached = getFromLocalStorageWithExpiry<JoinedGroup[]>(cacheKey);
            if (cached) {
                saveToLocalStorageWithExpiry(
                    cacheKey,
                    cached.filter((g) => g.id !== id),
                    CACHE_TIME.ONE_DAY,
                );
            }
        }
        return success;
    };

    return {
        state,
        error,
        groups,
        hasNextPage,
        endCursor,
        load,
        stop,
        leaveGroup,
    };
};
