import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { loadTargetGroups } from "src/modules/automation/services/post-radar.service"
import type { RadarTargetGroup } from "src/modules/automation/types/post-radar.types"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import { syncJoinedGroups } from "src/modules/facebook/services/synced-groups.service"

/**
 * Target groups for Post Radar, read from the local synced-groups store
 * (replaces the source `useGroups().fetchGroups` → `/api/v1/extension/groups`).
 */
export function usePostRadarGroups() {
  const { t } = useTranslation()
  const { profile } = useFacebook()
  const [groups, setGroups] = useState<RadarTargetGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncCount, setSyncCount] = useState(0)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      setGroups(await loadTargetGroups())
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const syncFromFacebook = useCallback(async () => {
    if (!profile?.uid) return
    setSyncing(true)
    setSyncCount(0)
    try {
      const count = await syncJoinedGroups(
        { uid: profile.uid, name: profile.name, avatar: profile.avatar },
        setSyncCount
      )
      toast.success(t("post_radar_toast_groups_synced", { count }))
      await fetchGroups()
    } catch (e) {
      toast.error(
        t("post_radar_toast_groups_sync_failed", {
          message: e instanceof Error ? e.message : String(e)
        })
      )
    } finally {
      setSyncing(false)
    }
  }, [profile, fetchGroups, t])

  return { groups, loading, syncing, syncCount, fetchGroups, syncFromFacebook }
}
