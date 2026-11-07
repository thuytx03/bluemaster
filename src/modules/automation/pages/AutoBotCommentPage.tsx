import { Bot } from "lucide-react"
import { useTranslation } from "react-i18next"

import { AutoBotCommentPanel } from "src/modules/automation/components/auto-bot-comment/AutoBotCommentPanel"
import FbToolPage from "src/modules/facebook/components/FbToolPage"

export default function AutoBotCommentPage() {
  const { t } = useTranslation()

  return (
    <FbToolPage
      title={t("auto_bot_comment_title")}
      description={t("auto_bot_comment_description")}
      icon={<Bot size={18} />}
      hideDelayConfig>
      {/* Each bot carries its own delay / batch-rest / auto-stop settings */}
      <AutoBotCommentPanel />
    </FbToolPage>
  )
}
