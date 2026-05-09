import { Card } from "antd"

import DownloadSeperateForm from "src/modules/download/components/DownloadSeperateForm"
import PageContainer from "src/modules/shared/components/PageContainer"

import { useTranslation } from "react-i18next"

const DownloadSeperatePage = () => {
  const { t } = useTranslation()
  return (
    <PageContainer title={t("download_seperate_title")}
      className="flex flex-col">
      <Card className="flex-1 shadow border rounded-xl">
        <DownloadSeperateForm />
      </Card>
    </PageContainer>
  )
}

export default DownloadSeperatePage
