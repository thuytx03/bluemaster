import { Download } from "lucide-react"
import { useTranslation } from "react-i18next"

import DownloadAllForm from "src/modules/download/components/DownloadAllForm"
import PageContainer from "src/modules/shared/components/PageContainer"

const DownloadAllPage = () => {
  const { t } = useTranslation()
  return (
    <PageContainer
      title={t("facebook_download_all_title")}
      description={t("nav_batch_download_desc")}
      icon={<Download size={20} />}
      accent="bm-bg-[#1877F2]/12 bm-text-[#1877F2]">
      <DownloadAllForm />
    </PageContainer>
  )
}

export default DownloadAllPage
