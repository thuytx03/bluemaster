import { MessageSquareCode } from "lucide-react"
import { useTranslation } from "react-i18next"

import { DownloadMessagesPanel } from "src/modules/content/components/download-messages/DownloadMessagesPanel"
import FbToolPage from "src/modules/facebook/components/FbToolPage"
import { Callout } from "src/modules/shared/ui"

export default function DownloadMessagesPage() {
  const { t } = useTranslation()

  return (
    <FbToolPage
      title={t("download_messages_title")}
      description={t("download_messages_description")}
      icon={<MessageSquareCode size={16} />}
      hideDelayConfig>
      <Callout tone="secure" compact title={t("download_messages_notice_title")}>
        {t("download_messages_notice_body_1")} <strong>{t("download_messages_notice_body_strong")}</strong>{" "}
        {t("download_messages_notice_body_2")}
      </Callout>
      <DownloadMessagesPanel />
    </FbToolPage>
  )
}
