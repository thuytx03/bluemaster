import { useCallback, useState } from "react"

import { loadIdentities } from "src/modules/automation/services/auto-bot-comment.service"
import type { BotCommentIdentity } from "src/modules/automation/types/auto-bot-comment.types"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"

/** Profile + Fanpages usable as comment identities (replaces `useInboxScan().fetchPages`). */
export function useAutoBotCommentIdentities() {
  const { profile } = useFacebook()
  const [identities, setIdentities] = useState<BotCommentIdentity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)

  const uid = profile?.uid
  const fetchIdentities = useCallback(
    async (force = false) => {
      if (!uid) return
      setLoading(true)
      setError(null)
      try {
        const res = await loadIdentities(uid, force)
        setIdentities(res.identities)
        setFetchedAt(res.fetchedAt)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading(false)
      }
    },
    [uid]
  )

  return { identities, loading, error, fetchedAt, fetchIdentities }
}
