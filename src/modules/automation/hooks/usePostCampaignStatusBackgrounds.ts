import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import postCampaignService from "src/modules/automation/services/post-campaign.service"
import type { StatusBgCategory } from "src/modules/automation/types/post-campaign.types"
import { getStatusBgCategories } from "src/modules/automation/utils/post-campaign-status-backgrounds.util"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"

/** Status background presets: the built-in list, replaced by Facebook's live list once it loads (once per mount). */
export function usePostCampaignStatusBackgrounds(): StatusBgCategory[] {
  const { profile } = useFacebook()
  const { t } = useTranslation()
  const [categories, setCategories] = useState<StatusBgCategory[]>(() =>
    getStatusBgCategories(t)
  )
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    if (!profile?.fb_dtsg || !profile?.uid) return
    fetched.current = true
    void postCampaignService
      .fetchStatusBackgrounds({
        color: t("campaign_manager_status_bg_category_color"),
        other: t("campaign_manager_status_bg_category_other")
      })
      .then((parsed) => {
        if (parsed && parsed.length > 0) setCategories(parsed)
      })
  }, [profile, t])

  return categories
}
