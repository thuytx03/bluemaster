import { MessageSquareText } from "lucide-react"
import { useTranslation } from "react-i18next"

import { CommentHunterPanel } from "src/modules/automation/components/comment-hunter/CommentHunterPanel"
import FbToolPage from "src/modules/facebook/components/FbToolPage"

/** Port of xthuy-social `pages/web/facebook/comment-hunter.tsx`. */
export default function CommentHunterPage() {
  const { t } = useTranslation()
  // The tool has its own delay config (key fb_delay_comment_hunter) in step 2.
  return (
    <FbToolPage
      title={t("comment_hunter_title")}
      description={t("comment_hunter_description")}
      icon={<MessageSquareText size={16} />}
      hideDelayConfig>
      <CommentHunterPanel />
    </FbToolPage>
  )
}
