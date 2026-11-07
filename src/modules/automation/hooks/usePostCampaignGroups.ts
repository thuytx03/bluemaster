import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import type { PostGroup } from "src/modules/automation/types/post-campaign.types"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import syncedGroupsService from "src/modules/facebook/services/synced-groups.service"

interface GroupsState {
  groups: PostGroup[]
  total: number
  loading: boolean
  syncing: boolean
  syncProgress: string
  error: string | null
  lastSyncedAt: string | null
}

/**
 * Groups to post to. Replaces the source's Laravel `/api/v1/extension/groups`
 * (list / sync / delete) with the local `synced-groups.service` store.
 */
export function usePostCampaignGroups() {
  const { profile } = useFacebook()
  const { t } = useTranslation()

  const [state, setState] = useState<GroupsState>({
    groups: [],
    total: 0,
    loading: false,
    syncing: false,
    syncProgress: "",
    error: null,
    lastSyncedAt: null
  })

  /** Load groups synced earlier (one identity, or all identities when `uid` is omitted). */
  const fetchGroups = useCallback(
    async (uid?: string) => {
      setState((s) => ({ ...s, loading: true, error: null }))
      try {
        const { groups, lastSyncedAt } =
          await syncedGroupsService.getGroups(uid)
        const all: PostGroup[] = groups.map((g) => ({
          groupId: g.groupId,
          groupName: g.groupName,
          avatarUrl: g.avatarUrl
        }))
        setState((s) => ({
          ...s,
          groups: all,
          total: all.length,
          loading: false,
          lastSyncedAt
        }))
      } catch (e) {
        const msg =
          (e as Error)?.message ??
          t("campaign_manager_runner_groups_load_error")
        setState((s) => ({ ...s, loading: false, error: msg }))
      }
    },
    [t]
  )

  /** Re-collect every joined group from Facebook and store it for the current account. */
  const syncFromFacebook = useCallback(async () => {
    const uid = profile?.uid
    if (!profile?.fb_dtsg || !uid) {
      setState((s) => ({
        ...s,
        error: t("campaign_manager_runner_error_not_logged_in_short")
      }))
      return
    }

    setState((s) => ({
      ...s,
      syncing: true,
      error: null,
      syncProgress: t("campaign_manager_runner_status_fetching_from_facebook")
    }))

    try {
      const count = await syncedGroupsService.syncJoinedGroups(
        { uid, name: profile.name, avatar: profile.avatar },
        (n) =>
          setState((s) => ({
            ...s,
            syncProgress: t("campaign_manager_runner_status_loading_count", {
              count: n
            })
          }))
      )
      if (!count) {
        setState((s) => ({
          ...s,
          syncing: false,
          syncProgress: "",
          error: t("campaign_manager_runner_error_no_groups_found")
        }))
        return
      }
      await fetchGroups(uid)
      setState((s) => ({ ...s, syncing: false, syncProgress: "" }))
    } catch (e) {
      const msg =
        (e as Error)?.message ?? t("campaign_manager_runner_error_sync_failed")
      setState((s) => ({ ...s, syncing: false, syncProgress: "", error: msg }))
    }
  }, [profile, fetchGroups, t])

  /** Forget the stored groups of the current account. */
  const clearGroups = useCallback(async () => {
    try {
      if (profile?.uid) await syncedGroupsService.removeIdentity(profile.uid)
      setState((s) => ({ ...s, groups: [], total: 0, lastSyncedAt: null }))
    } catch {
      /* ignore */
    }
  }, [profile])

  return { ...state, fetchGroups, syncFromFacebook, clearGroups }
}
