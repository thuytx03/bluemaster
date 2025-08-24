import { Card } from "antd"

import XDownloadAllForm from "src/components/features/download-all/x/XDownloadAllForm"
import PageContainer from "src/components/shared/PageContainer"

import { useTranslation } from "react-i18next"

const XDownloadAllPage = () => {
  const { t } = useTranslation()
  return (
    <PageContainer title={t("x_download_all_title")} className="flex flex-col">
      <Card className="flex-1 shadow border rounded-xl">
        <XDownloadAllForm />
      </Card>
    </PageContainer>
  )
}

export default XDownloadAllPage
