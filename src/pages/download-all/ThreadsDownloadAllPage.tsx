import { Card } from "antd"

import ThreadsDownloadAllForm from "src/components/features/download-all/threads/ThreadsDownloadAllForm"
import PageContainer from "src/components/shared/PageContainer"

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
