import { Card } from "antd"

import IgDownloadAllForm from "src/components/features/download-all/instagram/IgDownloadAllForm"
import PageContainer from "src/components/shared/PageContainer"

import { useTranslation } from "react-i18next"

const InstagramDownloadAllPage = () => {
  const { t } = useTranslation()
  return (
    <PageContainer
      title={t("instagram_download_all_title")}
      className="flex flex-col">
      <Card className="flex-1 shadow border rounded-xl">
        <IgDownloadAllForm />
      </Card>
    </PageContainer>
  )
}

export default InstagramDownloadAllPage
