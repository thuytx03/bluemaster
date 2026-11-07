import { Rss, ThumbsUp } from "lucide-react"
import { useTranslation } from "react-i18next"

import { FollowingPanel } from "src/modules/account/components/FollowingPanel"
import { LikedPagesPanel } from "src/modules/account/components/LikedPagesPanel"
import PrivacyNote from "src/modules/account/components/PrivacyNote"
import FbToolPage from "src/modules/facebook/components/FbToolPage"
import FbToolTabs from "src/modules/facebook/components/FbToolTabs"

/** Following hub: people / pages you follow, and pages you liked. */
export default function FollowingPage() {
  const { t } = useTranslation()
  return (
    <FbToolPage
      title={t("fb_following_hub")}
      description={t("fb_following_hub_desc")}
      icon={<Rss size={16} />}>
      <PrivacyNote />
      <FbToolTabs
        tabs={[
          {
            key: "following",
            label: t("fb_following"),
            icon: <Rss size={13} />,
            render: () => <FollowingPanel />
          },
          {
            key: "liked",
            label: t("fb_liked_pages"),
            icon: <ThumbsUp size={13} />,
            render: () => <LikedPagesPanel />
          }
        ]}
      />
    </FbToolPage>
  )
}
