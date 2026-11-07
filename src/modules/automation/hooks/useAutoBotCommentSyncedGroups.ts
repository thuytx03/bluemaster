import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import {
  getGroups,
  listIdentities,
  syncJoinedGroups
} from "src/modules/facebook/services/synced-groups.service"
import type {
  SyncedGroup,
  SyncedIdentity
} from "src/modules/facebook/types/synced-groups.types"

/**
 * Joined groups of the current profile from the local synced-groups store, with
 * a "sync from Facebook" action (port of the source `post-campaign/use-groups`,
 * Laravel `/api/v1/extension/groups{,/sync}` replaced by synced-groups.service).
 */
export function useAutoBotCommentSyncedGroups() {
  const { t } = useTranslation()
  const { profile } = useFacebook()
  const [groups, setGroups] = useState<SyncedGroup[]>([])
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [identities, setIdentities] = useState<SyncedIdentity[]>([])

  /** Identities that have synced groups (used by the library import). */
  const fetchIdentities = useCallback(async () => {
    try {
      setIdentities(await listIdentities())
    } catch {
      setIdentities([])
    }
  }, [])

  const fetchGroups = useCallback(async (uid?: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getGroups(uid)
      setGroups(res.groups)
      setLastSyncedAt(res.lastSyncedAt)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const syncFromFacebook = useCallback(async () => {
    if (!profile?.uid || !profile?.fb_dtsg) {
      setError(t("campaign_manager_runner_error_not_logged_in_short"))
      return
    }
    setSyncing(true)
    setError(null)
    setSyncProgress(t("campaign_manager_runner_status_fetching_from_facebook"))
    try {
      const stored = await syncJoinedGroups(
        { uid: profile.uid, name: profile.name, avatar: profile.avatar },
        (count) =>
          setSyncProgress(
            t("campaign_manager_runner_status_loading_count", { count })
          )
      )
      if (!stored) {
        setError(t("campaign_manager_runner_error_no_groups_found"))
        return
      }
      setGroups((await getGroups(profile.uid)).groups)
      setLastSyncedAt(new Date().toISOString())
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t("campaign_manager_runner_error_sync_failed")
      )
    } finally {
      setSyncing(false)
      setSyncProgress("")
    }
  }, [profile, t])

  return {
    groups,
    total: groups.length,
    identities,
    fetchIdentities,
    lastSyncedAt,
    loading,
    syncing,
    syncProgress,
    error,
    fetchGroups,
    syncFromFacebook
  }
}
