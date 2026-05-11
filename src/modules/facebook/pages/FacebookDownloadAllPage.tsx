import { Card } from "antd"

import FacebookDownloadAllForm from "../components/FacebookDownloadAllForm"
import PageContainer from "../../shared/components/PageContainer"

import { useTranslation } from "react-i18next"

const FacebookDownloadAllPage = () => {
  const { t } = useTranslation()
  return (
    <PageContainer
      title={t("facebook_download_all_title")}
      className="flex flex-col">
      <Card className="flex-1 shadow border rounded-xl">
        <FacebookDownloadAllForm />
      </Card>
    </PageContainer>
  )
}

export default FacebookDownloadAllPage
