import { Sparkles, UsersRound } from "lucide-react"
import { useTranslation } from "react-i18next"

import { GroupsPanel } from "src/modules/account/components/GroupsPanel"
import PrivacyNote from "src/modules/account/components/PrivacyNote"
import { SuggestedGroupsPanel } from "src/modules/account/components/SuggestedGroupsPanel"
import FbToolPage from "src/modules/facebook/components/FbToolPage"
import FbToolTabs from "src/modules/facebook/components/FbToolTabs"

/** Groups hub: joined + pending groups, and suggested groups to join. */
export default function GroupsPage() {
  const { t } = useTranslation()
  return (
    <FbToolPage
      title={t("fb_groups")}
      description={t("fb_groups_hub_desc")}
      icon={<UsersRound size={16} />}>
      <PrivacyNote />
      <FbToolTabs
        tabs={[
          {
            key: "mine",
            label: t("fb_tab_my_groups"),
            icon: <UsersRound size={13} />,
            render: () => <GroupsPanel />
          },
          {
            key: "suggested",
            label: t("fb_tab_suggested_groups"),
            icon: <Sparkles size={13} />,
            render: () => <SuggestedGroupsPanel />
          }
        ]}
      />
    </FbToolPage>
  )
}
