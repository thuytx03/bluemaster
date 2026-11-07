import { Radar } from "lucide-react"
import { useTranslation } from "react-i18next"

import PostRadarPanel from "src/modules/automation/components/post-radar/PostRadarPanel"
import {
  POST_RADAR_DELAY_DEFAULTS,
  POST_RADAR_DELAY_KEY
} from "src/modules/automation/utils/post-radar.util"
import { FacebookDelayConfig } from "src/modules/facebook/components/DelayConfigPanel"
import FbToolPage from "src/modules/facebook/components/FbToolPage"

export default function PostRadarPage() {
  const { t } = useTranslation()

  return (
    <FbToolPage
      title={t("post_radar_title")}
      description={t("post_radar_description")}
      icon={<Radar size={18} />}
      hideDelayConfig>
      {/* The run reads this tool's own key, so the panel edits that key (source bug: the shared panel edited another key) */}
      <FacebookDelayConfig
        storageKey={POST_RADAR_DELAY_KEY}
        defaults={POST_RADAR_DELAY_DEFAULTS}
        showSleepConfig={false}
        showLimitsConfig={false}
      />
      <PostRadarPanel />
    </FbToolPage>
  )
}
