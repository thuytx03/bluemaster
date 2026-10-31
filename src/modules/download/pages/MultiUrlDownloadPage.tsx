import { Link2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import MultiUrlDownloadForm from "src/modules/download/components/MultiUrlDownloadForm"
import PageContainer from "src/modules/shared/components/PageContainer"

const MultiUrlDownloadPage = () => {
  const { t } = useTranslation()
  return (
    <PageContainer
      title={t("multi_url_download_title")}
      description={t("nav_multi_url_download_desc")}
      icon={<Link2 size={20} />}
      accent="bm-bg-cyan-500/12 bm-text-cyan-600 dark:bm-text-cyan-400">
      <MultiUrlDownloadForm />
    </PageContainer>
  )
}

export default MultiUrlDownloadPage
