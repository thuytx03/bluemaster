import { Card } from "antd"

import ThreadsDownloadAllForm from "src/modules/threads/components/ThreadsDownloadAllForm"
import PageContainer from "src/modules/shared/components/PageContainer"

import { useTranslation } from "react-i18next"

const ThreadsDownloadAllPage = () => {
  const { t } = useTranslation()
  return (
    <PageContainer
      title={t("threads_download_all_title")}
      className="flex flex-col">
      <Card className="flex-1 shadow border rounded-xl">
        <ThreadsDownloadAllForm />
      </Card>
    </PageContainer>
  )
}

export default ThreadsDownloadAllPage
