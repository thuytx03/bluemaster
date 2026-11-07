import { useCallback, useState } from 'react';

import { CACHE_TIME, getMyUid } from 'src/modules/facebook/services/fb-graphql.service';
import { useTranslation } from 'react-i18next';
import friendsService from 'src/modules/account/services/friends.service';
import type { BlockedUser, Friend, RestrictedUser } from 'src/modules/account/types/friends.types';
import {
    getFromLocalStorageWithExpiry,
    removeFromLocalStorage,
    saveToLocalStorageWithExpiry,
} from 'src/utils/storage.util';

export const useFriends = () => {
    const { t } = useTranslation();
    const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [endCursor, setEndCursor] = useState<string | null>(null);

    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [blockedState, setBlockedState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [blockedHasNextPage, setBlockedHasNextPage] = useState(false);
    const [blockedEndCursor, setBlockedEndCursor] = useState<string | null>(null);

    const [restrictedUsers, setRestrictedUsers] = useState<RestrictedUser[]>([]);
    const [restrictedState, setRestrictedState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [restrictedHasNextPage, setRestrictedHasNextPage] = useState(false);
    const [restrictedEndCursor, setRestrictedEndCursor] = useState<string | null>(null);

    const [messageBlockedUsers, setMessageBlockedUsers] = useState<BlockedUser[]>([]);
    const [messageBlockedState, setMessageBlockedState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [messageBlockedHasNextPage, setMessageBlockedHasNextPage] = useState(false);
    const [messageBlockedEndCursor, setMessageBlockedEndCursor] = useState<string | null>(null);

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
                setFriends([]);
            }

            try {
                const uid = getMyUid();
                if (!uid) {
                    throw new Error(t('friends_error_not_logged_in'));
                }

                const cacheKey = `fb_friends_${uid}`;
                if (!forceRefresh && !accumulate && cursor === null) {
                    const cachedData = getFromLocalStorageWithExpiry<{ count: number; list: Friend[] }>(cacheKey);
                    if (cachedData !== null) {
                        setFriends(cachedData.list);
                        setTotalCount(cachedData.count);
                        setState('success');
                        return;
                    }
                }

                // Get total friends count
                const count = await friendsService.fetchFriendsCount(uid);
                setTotalCount(count);

                const result = await friendsService.fetchAllFriends(
                    uid,
                    cursor,
                    accumulate ? friends : [],
                    (list, nextCursor) => {
                        setFriends(list);
                        setHasNextPage(nextCursor !== null);
                        setEndCursor(nextCursor);
                    },
                );
                if (result.complete) {
                    saveToLocalStorageWithExpiry(cacheKey, { count, list: result.list }, CACHE_TIME.ONE_DAY);
                }
                setState('success');
            } catch (err) {
                setState('error');
                setError(err instanceof Error ? err.message : t('friends_error_generic'));
            }
        },
        [friends],
    );

    const unfriend = async (id: string): Promise<boolean> => {
        const uid = getMyUid();
        if (!uid) return false;

        const success = await friendsService.unfriendUser(uid, id);

        if (success) {
            const cacheKey = `fb_friends_${uid}`;
            const cached = getFromLocalStorageWithExpiry<{ count: number; list: Friend[] }>(cacheKey);
            if (cached) {
                saveToLocalStorageWithExpiry(
                    cacheKey,
                    { count: Math.max(0, cached.count - 1), list: cached.list.filter((f) => f.id !== id) },
                    CACHE_TIME.ONE_DAY,
                );
            }
        }
        return success;
    };

    const block = async (id: string): Promise<boolean> => {
        const uid = getMyUid();
        if (!uid) return false;

        const success = await friendsService.blockUser(uid, id);

        if (success) {
            const cacheKey = `fb_friends_${uid}`;
            const cached = getFromLocalStorageWithExpiry<{ count: number; list: Friend[] }>(cacheKey);
            if (cached) {
                saveToLocalStorageWithExpiry(
                    cacheKey,
                    { count: Math.max(0, cached.count - 1), list: cached.list.filter((f) => f.id !== id) },
                    CACHE_TIME.ONE_DAY,
                );
            }
            removeFromLocalStorage(`fb_blocked_users_${uid}`);
        }
        return success;
    };

    const unblock = async (id: string): Promise<boolean> => {
        const uid = getMyUid();
        if (!uid) return false;

        const success = await friendsService.unblockUser(uid, id);

        if (success) {
            setBlockedUsers((prev) => prev.filter((u) => u.id !== id));
            removeFromLocalStorage(`fb_blocked_users_${uid}`);
        }

        return success;
    };

    const restrict = async (id: string, action: 'BLOCK' | 'UNBLOCK'): Promise<boolean> => {
        const uid = getMyUid();
        if (!uid) return false;

        const success = await friendsService.setRestricted(uid, id, action);

        if (success) {
            if (action === 'BLOCK') {
                const friend = friends.find((f) => f.id === id);
                if (friend) {
                    const newRestrictedUser: RestrictedUser = {
                        id: friend.id,
                        name: friend.name,
                        gender: friend.gender,
                        profilePic: friend.profilePic,
                    };
                    setRestrictedUsers((prev) => {
                        if (prev.some((u) => u.id === id)) return prev;
                        return [...prev, newRestrictedUser];
                    });
                }
            } else {
                setRestrictedUsers((prev) => prev.filter((u) => u.id !== id));
            }
            removeFromLocalStorage(`fb_restricted_users_${uid}`);
        }

        return success;
    };

    const loadRestrictedUsers = useCallback(
        async ({
            cursor = null,
            accumulate = false,
            forceRefresh = false,
        }: {
            cursor: string | null;
            accumulate?: boolean;
            forceRefresh?: boolean;
        }): Promise<void> => {
            setRestrictedState('loading');
            setError(null);

            try {
                const uid = getMyUid();
                if (!uid) {
                    throw new Error(t('friends_error_not_logged_in'));
                }

                const cacheKey = `fb_restricted_users_${uid}`;
                if (cursor === null && !accumulate && !forceRefresh) {
                    const cachedData = getFromLocalStorageWithExpiry<RestrictedUser[]>(cacheKey);
                    if (cachedData !== null) {
                        setRestrictedUsers(cachedData);
                        setRestrictedState('success');
                        return;
                    }
                }

                if (!accumulate && cursor === null) {
                    setRestrictedUsers([]);
                }

                const page = await friendsService.fetchRestrictedUsersPage(uid, cursor);
                if (!page) {
                    setRestrictedState('success');
                    return;
                }

                const updatedList = accumulate ? [...restrictedUsers, ...page.users] : page.users;
                setRestrictedUsers(updatedList);
                setRestrictedHasNextPage(page.hasNextPage);
                setRestrictedEndCursor(page.endCursor);
                setRestrictedState('success');

                if (!page.hasNextPage) {
                    saveToLocalStorageWithExpiry(cacheKey, updatedList, CACHE_TIME.ONE_DAY);
                }
            } catch (err) {
                setRestrictedState('error');
                setError(err instanceof Error ? err.message : t('friends_error_generic'));
            }
        },
        [restrictedUsers],
    );

    const loadBlockedUsers = useCallback(
        async ({
            cursor = null,
            accumulate = false,
            forceRefresh = false,
        }: {
            cursor: string | null;
            accumulate?: boolean;
            forceRefresh?: boolean;
        }): Promise<void> => {
            setBlockedState('loading');
            setError(null);

            try {
                const uid = getMyUid();
                if (!uid) {
                    throw new Error(t('friends_error_not_logged_in'));
                }

                const cacheKey = `fb_blocked_users_${uid}`;
                if (cursor === null && !accumulate && !forceRefresh) {
                    const cachedData = getFromLocalStorageWithExpiry<BlockedUser[]>(cacheKey);
                    if (cachedData !== null) {
                        setBlockedUsers(cachedData);
                        setBlockedState('success');
                        return;
                    }
                }

                if (!accumulate && cursor === null) {
                    setBlockedUsers([]);
                }

                const page = await friendsService.fetchBlockedUsersPage(uid, cursor);
                if (!page) {
                    setBlockedState('success');
                    return;
                }

                const updatedList = accumulate ? [...blockedUsers, ...page.users] : page.users;
                setBlockedUsers(updatedList);
                setBlockedHasNextPage(page.hasNextPage);
                setBlockedEndCursor(page.endCursor);
                setBlockedState('success');

                if (!page.hasNextPage) {
                    saveToLocalStorageWithExpiry(cacheKey, updatedList, CACHE_TIME.ONE_DAY);
                }
            } catch (err) {
                setBlockedState('error');
                setError(err instanceof Error ? err.message : t('friends_error_generic'));
            }
        },
        [blockedUsers],
    );

    const loadMessageBlockedUsers = useCallback(
        async ({
            cursor = null,
            accumulate = false,
            forceRefresh = false,
        }: {
            cursor: string | null;
            accumulate?: boolean;
            forceRefresh?: boolean;
        }): Promise<void> => {
            setMessageBlockedState('loading');
            setError(null);

            try {
                const uid = getMyUid();
                if (!uid) {
                    throw new Error(t('friends_error_not_logged_in'));
                }

                const cacheKey = `fb_message_blocked_users_${uid}`;
                if (cursor === null && !accumulate && !forceRefresh) {
                    const cachedData = getFromLocalStorageWithExpiry<BlockedUser[]>(cacheKey);
                    if (cachedData !== null) {
                        setMessageBlockedUsers(cachedData);
                        setMessageBlockedState('success');
                        return;
                    }
                }

                if (!accumulate && cursor === null) {
                    setMessageBlockedUsers([]);
                }

                const page = await friendsService.fetchMessageBlockedUsersPage(uid, cursor);
                if (!page) {
                    setMessageBlockedState('success');
                    return;
                }

                const updatedList = accumulate ? [...messageBlockedUsers, ...page.users] : page.users;
                setMessageBlockedUsers(updatedList);
                setMessageBlockedHasNextPage(page.hasNextPage);
                setMessageBlockedEndCursor(page.endCursor);
                setMessageBlockedState('success');

                if (!page.hasNextPage) {
                    saveToLocalStorageWithExpiry(cacheKey, updatedList, CACHE_TIME.ONE_DAY);
                }
            } catch (err) {
                setMessageBlockedState('error');
                setError(err instanceof Error ? err.message : t('friends_error_generic'));
            }
        },
        [messageBlockedUsers],
    );

    const blockMessage = async (id: string, action: 'BLOCK' | 'UNBLOCK'): Promise<boolean> => {
        const uid = getMyUid();
        if (!uid) return false;

        const success = await friendsService.setMessageBlock(uid, id, action);

        if (success) {
            if (action === 'BLOCK') {
                const friend = friends.find((f) => f.id === id);
                if (friend) {
                    const newBlockedUser: BlockedUser = {
                        id: friend.id,
                        name: friend.name,
                        gender: friend.gender,
                        profilePic: friend.profilePic,
                    };
                    setMessageBlockedUsers((prev) => {
                        if (prev.some((u) => u.id === id)) return prev;
                        return [...prev, newBlockedUser];
                    });
                }
            } else {
                setMessageBlockedUsers((prev) => prev.filter((u) => u.id !== id));
            }
            removeFromLocalStorage(`fb_message_blocked_users_${uid}`);
        }

        return success;
    };

    const poke = async (id: string): Promise<boolean> => {
        const uid = getMyUid();
        if (!uid) return false;

        const success = await friendsService.pokeUser(uid, id);
        return success;
    };

    return {
        state,
        error,
        friends,
        totalCount,
        hasNextPage,
        endCursor,
        load,
        unfriend,
        block,
        unblock,
        blockedUsers,
        blockedState,
        blockedHasNextPage,
        blockedEndCursor,
        loadBlockedUsers,
        restrictedUsers,
        restrictedState,
        restrictedHasNextPage,
        restrictedEndCursor,
        loadRestrictedUsers,
        restrict,
        messageBlockedUsers,
        messageBlockedState,
        messageBlockedHasNextPage,
        messageBlockedEndCursor,
        loadMessageBlockedUsers,
        blockMessage,
        poke,
    };
};
