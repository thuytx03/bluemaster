import { useCallback, useEffect, useState } from "react"

import postCampaignService from "src/modules/automation/services/post-campaign.service"
import type { CheckinPlace } from "src/modules/automation/types/post-campaign.types"

/** Check-in place search: nearby places on mount, then a 400 ms debounced search on `query`. */
export function usePostCampaignCheckinSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CheckinPlace[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (q: string) => {
    setLoading(true)
    try {
      setResults(await postCampaignService.searchCheckinPlaces(q))
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void search("")
  }, [search])

  useEffect(() => {
    if (!query) return
    const timer = setTimeout(() => void search(query), 400)
    return () => clearTimeout(timer)
  }, [query, search])

  return { query, setQuery, results, loading }
}
