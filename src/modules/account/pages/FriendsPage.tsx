import { Inbox, Send, Users } from "lucide-react"
import { useTranslation } from "react-i18next"

import { FriendRequestsPanel } from "src/modules/account/components/FriendRequestsPanel"
import { FriendsPanel } from "src/modules/account/components/friends/FriendsPanel"
import { OutgoingRequestsPanel } from "src/modules/account/components/OutgoingRequestsPanel"
import PrivacyNote from "src/modules/account/components/PrivacyNote"
import FbToolPage from "src/modules/facebook/components/FbToolPage"
import FbToolTabs from "src/modules/facebook/components/FbToolTabs"

/** Friends hub: friend list (+ blocked / restricted), received and sent requests. */
export default function FriendsPage() {
  const { t } = useTranslation()
  return (
    <FbToolPage
      title={t("fb_friends_hub")}
      description={t("fb_friends_hub_desc")}
      icon={<Users size={16} />}>
      <PrivacyNote />
      <FbToolTabs
        tabs={[
          {
            key: "list",
            label: t("fb_tab_friend_list"),
            icon: <Users size={13} />,
            render: () => <FriendsPanel />
          },
          {
            key: "requests",
            label: t("fb_tab_friend_requests"),
            icon: <Inbox size={13} />,
            render: () => <FriendRequestsPanel />
          },
          {
            key: "sent",
            label: t("fb_tab_sent_requests"),
            icon: <Send size={13} />,
            render: () => <OutgoingRequestsPanel />
          }
        ]}
      />
    </FbToolPage>
  )
}
