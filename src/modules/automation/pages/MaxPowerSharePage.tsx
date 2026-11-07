import { Share2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { MaxPowerSharePanel } from "src/modules/automation/components/max-power-share/MaxPowerSharePanel"
import FbToolPage from "src/modules/facebook/components/FbToolPage"

export default function MaxPowerSharePage() {
  const { t } = useTranslation()

  return (
    <FbToolPage
      title={t("max_power_share_title")}
      description={t("max_power_share_description")}
      icon={<Share2 size={18} />}
      hideDelayConfig>
      <MaxPowerSharePanel />
    </FbToolPage>
  )
}
