import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { fetchIdentities } from "src/modules/automation/services/max-power-share.service"
import type { SyncedIdentity } from "src/modules/automation/types/max-power-share.types"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import { syncJoinedGroups } from "src/modules/facebook/services/synced-groups.service"

/** Identity picker state: profile + Fanpages with their synced group counts, and the "sync groups from Facebook" action. */
export function useMaxPowerShareIdentities() {
  const { t } = useTranslation()
  const { profile } = useFacebook()
  const [identities, setIdentities] = useState<SyncedIdentity[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState("")

  const load = useCallback(async () => {
    if (!profile?.uid) return
    setLoading(true)
    try {
      setIdentities(await fetchIdentities(profile))
    } catch {
      setIdentities([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid, profile?.name, profile?.avatar])

  /** Fetches the profile's joined groups from Facebook, stores them locally, then reloads. Resolves to the number of groups synced. */
  const sync = useCallback(async (): Promise<number> => {
    const fbDtsg = profile?.fb_dtsg
    const uid = profile?.uid
    if (!fbDtsg || !uid) return 0

    setSyncing(true)
    setSyncProgress(t("max_power_share_sync_progress_fetching"))
    try {
      const count = await syncJoinedGroups(
        { uid, name: profile.name, avatar: profile.avatar },
        (n) =>
          setSyncProgress(
            t("max_power_share_sync_progress_loading", { count: n })
          )
      )
      if (count > 0) toast.success(t("max_power_share_sync_done", { count }))
      else toast.warning(t("max_power_share_no_synced_groups"))
      await load()
      return count
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e))
      return 0
    } finally {
      setSyncing(false)
      setSyncProgress("")
    }
  }, [profile, load, t])

  return {
    identities,
    loading,
    syncing,
    syncProgress,
    load,
    sync,
    canSync: !!profile?.fb_dtsg
  }
}
