import { FileText } from "lucide-react"
import { useTranslation } from "react-i18next"

import { PostsPanel } from "src/modules/content/components/posts/PostsPanel"
import FbToolPage from "src/modules/facebook/components/FbToolPage"

/** Port of xthuy-social `pages/web/facebook/posts/page` (Inertia head / breadcrumbs dropped). */
export default function PostsPage() {
  const { t } = useTranslation()

  return (
    <FbToolPage title={t("posts_title")} description={t("posts_description")} icon={<FileText size={16} />}>
      <PostsPanel />
    </FbToolPage>
  )
}
