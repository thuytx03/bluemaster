import { Send } from "lucide-react"
import { useTranslation } from "react-i18next"

import { PostCampaignPanel } from "src/modules/automation/components/post-campaign/PostCampaignPanel"
import {
  POST_CAMPAIGN_DELAY_DEFAULTS,
  POST_CAMPAIGN_DELAY_KEY
} from "src/modules/automation/utils/post-campaign.util"
import { FacebookDelayConfig } from "src/modules/facebook/components/DelayConfigPanel"
import FbToolPage from "src/modules/facebook/components/FbToolPage"

export default function PostCampaignPage() {
  const { t } = useTranslation()

  return (
    <FbToolPage
      title={t("post_campaign_title")}
      description={t("post_campaign_description")}
      icon={<Send size={18} />}
      hideDelayConfig>
      {/* The campaign reads its delays from its own key, so edit that one here */}
      <FacebookDelayConfig
        storageKey={POST_CAMPAIGN_DELAY_KEY}
        defaults={POST_CAMPAIGN_DELAY_DEFAULTS}
        showLimitsConfig={false}
      />
      <PostCampaignPanel />
    </FbToolPage>
  )
}
