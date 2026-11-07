import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  BlockedTab,
  MessageBlockedTab,
  RestrictedTab
} from "src/modules/account/components/friends/BlockeeTab"
import { FriendsTab } from "src/modules/account/components/friends/FriendsTab"
import { removeFromSet } from "src/modules/account/components/friends/FriendsTableParts"
import { useFriends } from "src/modules/account/hooks/useFriends"
import type { Friend } from "src/modules/account/types/friends.types"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import type { FriendsBulkState as BulkState } from "src/modules/facebook/types/bulk.types"
import { Badge, Tabs } from "src/modules/shared/ui"

/** Friends list with the restricted / blocked / message-blocked tabs. */
export function FriendsPanel() {
  const { t } = useTranslation()
  const { profile } = useFacebook()
  const {
    state,
    friends: apiFriends,
    totalCount,
    load,
    unfriend,
    block,
    unblock,
    blockedUsers,
    blockedState,
    loadBlockedUsers,
    restrictedUsers,
    restrictedState,
    loadRestrictedUsers,
    restrict,
    messageBlockedUsers,
    messageBlockedState,
    loadMessageBlockedUsers,
    blockMessage,
    poke
  } = useFriends()

  const [localFriends, setLocalFriends] = useState<Friend[]>([])
  const [restrictedIds, setRestrictedIds] = useState<Set<string>>(new Set())
  const [messageBlockedIds, setMessageBlockedIds] = useState<Set<string>>(
    new Set()
  )
  const [bulkRunning, setBulkRunning] = useState<BulkState | null>(null)
  const bulkStopRef = useRef<boolean>(false)

  useEffect(() => {
    if (profile?.uid) {
      load({ cursor: null, accumulate: false, forceRefresh: false })
      loadBlockedUsers({ cursor: null, accumulate: false })
      loadRestrictedUsers({ cursor: null, accumulate: false })
      loadMessageBlockedUsers({ cursor: null, accumulate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid])

  useEffect(() => {
    if (apiFriends && apiFriends.length > 0) {
      setLocalFriends(apiFriends)
    }
  }, [apiFriends])

  useEffect(() => {
    if (restrictedUsers && restrictedUsers.length > 0) {
      setRestrictedIds(new Set(restrictedUsers.map((u) => u.id)))
    }
  }, [restrictedUsers])

  useEffect(() => {
    if (messageBlockedUsers && messageBlockedUsers.length > 0) {
      setMessageBlockedIds(new Set(messageBlockedUsers.map((u) => u.id)))
    }
  }, [messageBlockedUsers])

  const bulkProps = { bulkRunning, setBulkRunning, bulkStopRef }

  return (
    <div className="bm-flex bm-w-full bm-flex-col bm-gap-3">
      <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
        <h2 className="bm-text-[15px] bm-font-semibold bm-text-fg">
          {t("friends_shared_page_heading")}
        </h2>
        <Badge tone="success">
          {t("friends_shared_loaded_count", {
            count: localFriends.length,
            total: totalCount > 0 ? `/${totalCount}` : ""
          })}
        </Badge>
      </div>

      <Tabs
        defaultActiveKey="friends"
        items={[
          {
            key: "friends",
            label: t("friends_shared_tab_friends", {
              count: localFriends.length
            }),
            content: (
              <FriendsTab
                localFriends={localFriends}
                state={state}
                load={load}
                unfriend={unfriend}
                block={block}
                restrict={restrict}
                unblock={unblock}
                restrictedIds={restrictedIds}
                setRestrictedIds={setRestrictedIds}
                messageBlockedIds={messageBlockedIds}
                setMessageBlockedIds={setMessageBlockedIds}
                blockMessage={blockMessage}
                poke={poke}
                {...bulkProps}
              />
            )
          },
          {
            key: "restricted",
            label: t("friends_shared_tab_restricted", {
              count: restrictedUsers.length
            }),
            content: (
              <RestrictedTab
                restrictedUsers={restrictedUsers}
                restrictedState={restrictedState}
                loadRestrictedUsers={loadRestrictedUsers}
                restrict={restrict}
                onUnrestricted={(id) =>
                  setRestrictedIds((prev) => removeFromSet(prev, id))
                }
                {...bulkProps}
              />
            )
          },
          {
            key: "blocked",
            label: t("friends_shared_tab_blocked", {
              count: blockedUsers.length
            }),
            content: (
              <BlockedTab
                blockedUsers={blockedUsers}
                blockedState={blockedState}
                loadBlockedUsers={loadBlockedUsers}
                unblock={unblock}
                {...bulkProps}
              />
            )
          },
          {
            key: "message_blocked",
            label: t("friends_shared_tab_message_blocked", {
              count: messageBlockedUsers.length
            }),
            content: (
              <MessageBlockedTab
                messageBlockedUsers={messageBlockedUsers}
                messageBlockedState={messageBlockedState}
                loadMessageBlockedUsers={loadMessageBlockedUsers}
                blockMessage={blockMessage}
                onUnblocked={(id) =>
                  setMessageBlockedIds((prev) => removeFromSet(prev, id))
                }
                {...bulkProps}
              />
            )
          }
        ]}
      />
    </div>
  )
}
