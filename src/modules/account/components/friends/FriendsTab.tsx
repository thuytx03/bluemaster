import {
  Ban,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Hand,
  History,
  MessageSquare,
  MessageSquareOff,
  RotateCw,
  Search,
  TrendingUp,
  Unlock,
  UserMinus
} from "lucide-react"
import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useEffect,
  useMemo,
  useState
} from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { normalizeForSearch } from "src/configs/tools.config"
import {
  addToSet,
  BulkProgress,
  FriendRowMenu,
  genderLabel,
  LoadFn,
  LoadState,
  removeFromSet,
  rowClass,
  TableShell,
  TD,
  TH,
  Toolbar,
  UserCell
} from "src/modules/account/components/friends/FriendsTableParts"
import type { Friend } from "src/modules/account/types/friends.types"
import { TableFacebookPagination } from "src/modules/facebook/components/TablePagination"
import type { FriendsBulkState as BulkState } from "src/modules/facebook/types/bulk.types"
import { runFacebookBulkAction } from "src/modules/facebook/utils/bulk-action.util"
import {
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  IconButton,
  Input
} from "src/modules/shared/ui"
import { exportToCSV } from "src/utils/export.util"

interface FriendsTabProps {
  localFriends: Friend[]
  state: LoadState
  load: LoadFn
  unfriend: (id: string) => Promise<boolean>
  block: (id: string) => Promise<boolean>
  restrict: (id: string, action: "BLOCK" | "UNBLOCK") => Promise<boolean>
  unblock: (id: string) => Promise<boolean>
  restrictedIds: Set<string>
  setRestrictedIds: Dispatch<SetStateAction<Set<string>>>
  messageBlockedIds: Set<string>
  setMessageBlockedIds: Dispatch<SetStateAction<Set<string>>>
  blockMessage: (id: string, action: "BLOCK" | "UNBLOCK") => Promise<boolean>
  poke: (id: string) => Promise<boolean>
  bulkRunning: BulkState | null
  setBulkRunning: Dispatch<SetStateAction<BulkState | null>>
  bulkStopRef: MutableRefObject<boolean>
}

type Target = { id: string; name: string } | null

export function FriendsTab({
  localFriends,
  state,
  load,
  unfriend,
  block,
  restrict,
  unblock,
  restrictedIds,
  setRestrictedIds,
  messageBlockedIds,
  setMessageBlockedIds,
  blockMessage,
  poke,
  bulkRunning,
  setBulkRunning,
  bulkStopRef
}: FriendsTabProps) {
  const { t } = useTranslation()
  const [unfriendedIds, setUnfriendedIds] = useState<Set<string>>(new Set())
  const [unfriendingIds, setUnfriendingIds] = useState<Set<string>>(new Set())
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set())
  const [blockingIds, setBlockingIds] = useState<Set<string>>(new Set())
  const [unblockingIds, setUnblockingIds] = useState<Set<string>>(new Set())

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [restrictingIds, setRestrictingIds] = useState<Set<string>>(new Set())
  const [unrestrictingIds, setUnrestrictingIds] = useState<Set<string>>(
    new Set()
  )

  const [blockingMessageIds, setBlockingMessageIds] = useState<Set<string>>(
    new Set()
  )
  const [unblockingMessageIds, setUnblockingMessageIds] = useState<Set<string>>(
    new Set()
  )
  const [pokingIds, setPokingIds] = useState<Set<string>>(new Set())

  // Confirm dialogs
  const [confirmBlockUser, setConfirmBlockUser] = useState<Target>(null)
  const [confirmUnfriendUser, setConfirmUnfriendUser] = useState<Target>(null)
  const [confirmUnblockUser, setConfirmUnblockUser] = useState<Target>(null)
  const [confirmBulkBlock, setConfirmBulkBlock] = useState(false)
  const [confirmRestrictUser, setConfirmRestrictUser] = useState<Target>(null)
  const [confirmUnrestrictUser, setConfirmUnrestrictUser] =
    useState<Target>(null)
  const [confirmBulkRestrict, setConfirmBulkRestrict] = useState(false)
  const [confirmBlockMessageUser, setConfirmBlockMessageUser] =
    useState<Target>(null)
  const [confirmUnblockMessageUser, setConfirmUnblockMessageUser] =
    useState<Target>(null)
  const [confirmBulkBlockMessage, setConfirmBulkBlockMessage] = useState(false)

  const handleReload = () => {
    load({ cursor: null, accumulate: false, forceRefresh: true })
  }

  const filteredFriends = useMemo(() => {
    const query = normalizeForSearch(searchQuery)
    return localFriends.filter(
      (friend) =>
        normalizeForSearch(friend.name).includes(query) ||
        friend.displayId.includes(query) ||
        normalizeForSearch(friend.gender).includes(query)
    )
  }, [localFriends, searchQuery])

  const paginatedFriends = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredFriends.slice(startIndex, startIndex + pageSize)
  }, [filteredFriends, currentPage, pageSize])

  const totalPages = Math.ceil(filteredFriends.length / pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedFriends.length) {
      setSelectedIds(new Set())
    } else {
      const newSelection = new Set<string>()
      paginatedFriends.forEach((f) => newSelection.add(f.id))
      setSelectedIds(newSelection)
    }
  }

  const toggleSelectOne = (id: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(id)) newSelection.delete(id)
    else newSelection.add(id)
    setSelectedIds(newSelection)
  }

  const handleUnfriendOne = async (id: string, name: string) => {
    setUnfriendingIds((prev) => addToSet(prev, id))
    const success = await unfriend(id)
    setUnfriendingIds((prev) => removeFromSet(prev, id))
    if (success) {
      setUnfriendedIds((prev) => addToSet(prev, id))
      toast.success(t("friends_friends_tab_toast_unfriend_success", { name }))
    } else {
      toast.error(t("friends_friends_tab_toast_unfriend_failed", { name }))
    }
  }

  const handleConfirmBlockOne = async () => {
    if (!confirmBlockUser) return
    const { id, name } = confirmBlockUser
    setConfirmBlockUser(null)
    setBlockingIds((prev) => addToSet(prev, id))
    const success = await block(id)
    setBlockingIds((prev) => removeFromSet(prev, id))
    if (success) {
      setBlockedIds((prev) => addToSet(prev, id))
      toast.success(t("friends_friends_tab_toast_block_success", { name }))
    } else {
      toast.error(t("friends_friends_tab_toast_block_failed", { name }))
    }
  }

  const handleConfirmUnblockOne = async () => {
    if (!confirmUnblockUser) return
    const { id, name } = confirmUnblockUser
    setConfirmUnblockUser(null)
    setUnblockingIds((prev) => addToSet(prev, id))
    const success = await unblock(id)
    setUnblockingIds((prev) => removeFromSet(prev, id))
    if (success) {
      setBlockedIds((prev) => removeFromSet(prev, id))
      toast.success(t("friends_friends_tab_toast_unblock_success", { name }))
    } else {
      toast.error(t("friends_friends_tab_toast_unblock_failed", { name }))
    }
  }

  const handleConfirmRestrictOne = async () => {
    if (!confirmRestrictUser) return
    const { id, name } = confirmRestrictUser
    setConfirmRestrictUser(null)
    setRestrictingIds((prev) => addToSet(prev, id))
    const success = await restrict(id, "BLOCK")
    setRestrictingIds((prev) => removeFromSet(prev, id))
    if (success) {
      setRestrictedIds((prev) => addToSet(prev, id))
      toast.success(t("friends_friends_tab_toast_restrict_success", { name }))
    } else {
      toast.error(t("friends_friends_tab_toast_restrict_failed", { name }))
    }
  }

  const handleConfirmUnrestrictOne = async () => {
    if (!confirmUnrestrictUser) return
    const { id, name } = confirmUnrestrictUser
    setConfirmUnrestrictUser(null)
    setUnrestrictingIds((prev) => addToSet(prev, id))
    const success = await restrict(id, "UNBLOCK")
    setUnrestrictingIds((prev) => removeFromSet(prev, id))
    if (success) {
      setRestrictedIds((prev) => removeFromSet(prev, id))
      toast.success(t("friends_friends_tab_toast_unrestrict_success", { name }))
    } else {
      toast.error(t("friends_friends_tab_toast_unrestrict_failed", { name }))
    }
  }

  const handleConfirmBlockMessageOne = async () => {
    if (!confirmBlockMessageUser) return
    const { id, name } = confirmBlockMessageUser
    setConfirmBlockMessageUser(null)
    setBlockingMessageIds((prev) => addToSet(prev, id))
    const success = await blockMessage(id, "BLOCK")
    setBlockingMessageIds((prev) => removeFromSet(prev, id))
    if (success) {
      setMessageBlockedIds((prev) => addToSet(prev, id))
      toast.success(
        t("friends_friends_tab_toast_block_message_success", { name })
      )
    } else {
      toast.error(t("friends_friends_tab_toast_block_message_failed", { name }))
    }
  }

  const handleConfirmUnblockMessageOne = async () => {
    if (!confirmUnblockMessageUser) return
    const { id, name } = confirmUnblockMessageUser
    setConfirmUnblockMessageUser(null)
    setUnblockingMessageIds((prev) => addToSet(prev, id))
    const success = await blockMessage(id, "UNBLOCK")
    setUnblockingMessageIds((prev) => removeFromSet(prev, id))
    if (success) {
      setMessageBlockedIds((prev) => removeFromSet(prev, id))
      toast.success(
        t("friends_friends_tab_toast_unblock_message_success", { name })
      )
    } else {
      toast.error(
        t("friends_friends_tab_toast_unblock_message_failed", { name })
      )
    }
  }

  const handlePokeOne = async (id: string, name: string) => {
    setPokingIds((prev) => addToSet(prev, id))
    const success = await poke(id)
    setPokingIds((prev) => removeFromSet(prev, id))
    if (success) {
      toast.success(t("friends_friends_tab_toast_poke_success", { name }))
    } else {
      toast.error(t("friends_friends_tab_toast_poke_failed", { name }))
    }
  }

  const bulkUnfriendTargets = useMemo(
    () => Array.from(selectedIds).filter((id) => !unfriendedIds.has(id)),
    [selectedIds, unfriendedIds]
  )

  const bulkBlockTargets = useMemo(
    () => Array.from(selectedIds).filter((id) => !blockedIds.has(id)),
    [selectedIds, blockedIds]
  )

  const bulkRestrictTargets = useMemo(
    () =>
      Array.from(selectedIds).filter(
        (id) =>
          !restrictedIds.has(id) &&
          !unfriendedIds.has(id) &&
          !blockedIds.has(id)
      ),
    [selectedIds, restrictedIds, unfriendedIds, blockedIds]
  )

  const bulkBlockMessageTargets = useMemo(
    () =>
      Array.from(selectedIds).filter(
        (id) =>
          !messageBlockedIds.has(id) &&
          !unfriendedIds.has(id) &&
          !blockedIds.has(id)
      ),
    [selectedIds, messageBlockedIds, unfriendedIds, blockedIds]
  )

  const bulkPokeTargets = useMemo(
    () =>
      Array.from(selectedIds).filter(
        (id) => !unfriendedIds.has(id) && !blockedIds.has(id)
      ),
    [selectedIds, unfriendedIds, blockedIds]
  )

  const bulkUnrestrictTargets = useMemo(
    () =>
      Array.from(selectedIds).filter(
        (id) =>
          restrictedIds.has(id) && !unfriendedIds.has(id) && !blockedIds.has(id)
      ),
    [selectedIds, restrictedIds, unfriendedIds, blockedIds]
  )

  const handleBulkUnfriend = async () => {
    const targets = bulkUnfriendTargets
    if (targets.length === 0) return
    await runFacebookBulkAction({
      targets,
      actionType: "unfriend",
      bulkStopRef,
      setBulkRunning,
      executeSingle: async (id) => {
        setUnfriendingIds((prev) => addToSet(prev, id))
        const ok = await unfriend(id)
        setUnfriendingIds((prev) => removeFromSet(prev, id))
        if (ok) {
          setUnfriendedIds((prev) => addToSet(prev, id))
          return true
        }
        return false
      },
      onFinished: (success, fail) => {
        toast.success(
          t("friends_friends_tab_toast_bulk_unfriend_finished", {
            success,
            fail
          })
        )
      }
    })
  }

  const handleConfirmBulkBlock = async () => {
    setConfirmBulkBlock(false)
    const targets = bulkBlockTargets
    if (targets.length === 0) return
    await runFacebookBulkAction({
      targets,
      actionType: "block",
      bulkStopRef,
      setBulkRunning,
      executeSingle: async (id) => {
        setBlockingIds((prev) => addToSet(prev, id))
        const ok = await block(id)
        setBlockingIds((prev) => removeFromSet(prev, id))
        if (ok) {
          setBlockedIds((prev) => addToSet(prev, id))
          return true
        }
        return false
      },
      onFinished: (success, fail) => {
        toast.success(
          t("friends_friends_tab_toast_bulk_block_finished", { success, fail })
        )
      }
    })
  }

  const handleConfirmBulkRestrict = async () => {
    setConfirmBulkRestrict(false)
    const targets = bulkRestrictTargets
    if (targets.length === 0) return
    await runFacebookBulkAction({
      targets,
      actionType: "restrict",
      bulkStopRef,
      setBulkRunning,
      executeSingle: async (id) => {
        setRestrictingIds((prev) => addToSet(prev, id))
        const ok = await restrict(id, "BLOCK")
        setRestrictingIds((prev) => removeFromSet(prev, id))
        if (ok) {
          setRestrictedIds((prev) => addToSet(prev, id))
          return true
        }
        return false
      },
      onFinished: (success, fail) => {
        toast.success(
          t("friends_friends_tab_toast_bulk_restrict_finished", {
            success,
            fail
          })
        )
      }
    })
  }

  const handleConfirmBulkBlockMessage = async () => {
    setConfirmBulkBlockMessage(false)
    const targets = bulkBlockMessageTargets
    if (targets.length === 0) return
    await runFacebookBulkAction({
      targets,
      // Source uses 'restrict' as the progress type for bulk message-blocking.
      actionType: "restrict",
      bulkStopRef,
      setBulkRunning,
      executeSingle: async (id) => {
        setBlockingMessageIds((prev) => addToSet(prev, id))
        const ok = await blockMessage(id, "BLOCK")
        setBlockingMessageIds((prev) => removeFromSet(prev, id))
        if (ok) {
          setMessageBlockedIds((prev) => addToSet(prev, id))
          return true
        }
        return false
      },
      onFinished: (success, fail) => {
        toast.success(
          t("friends_friends_tab_toast_bulk_block_message_finished", {
            success,
            fail
          })
        )
      }
    })
  }

  const handleBulkPoke = async () => {
    const targets = bulkPokeTargets
    if (targets.length === 0) return
    await runFacebookBulkAction({
      targets,
      actionType: "poke",
      bulkStopRef,
      setBulkRunning,
      executeSingle: async (id) => {
        setPokingIds((prev) => addToSet(prev, id))
        const ok = await poke(id)
        setPokingIds((prev) => removeFromSet(prev, id))
        return ok
      },
      onFinished: (success, fail) => {
        toast.success(
          t("friends_friends_tab_toast_bulk_poke_finished", { success, fail })
        )
      }
    })
  }

  const runBulkUnrestrict = async (targets: string[]) => {
    await runFacebookBulkAction({
      targets,
      actionType: "unrestrict",
      bulkStopRef,
      setBulkRunning,
      executeSingle: async (id) => {
        setUnrestrictingIds((prev) => addToSet(prev, id))
        const ok = await restrict(id, "UNBLOCK")
        setUnrestrictingIds((prev) => removeFromSet(prev, id))
        if (ok) {
          setRestrictedIds((prev) => removeFromSet(prev, id))
          return true
        }
        return false
      },
      onFinished: (success, fail) => {
        toast.success(
          t("friends_friends_tab_toast_bulk_unrestrict_finished", {
            success,
            fail
          })
        )
      }
    })
  }

  const handleBulkUnrestrictFriends = async () => {
    const targets = bulkUnrestrictTargets
    if (targets.length === 0) return
    await runBulkUnrestrict(targets)
    setSelectedIds(new Set())
  }

  const stopBulk = () => {
    bulkStopRef.current = true
  }

  const genderText = (gender: string) => genderLabel(t, gender, "N/A")

  const handleExport = () => {
    const listToExport =
      selectedIds.size > 0
        ? localFriends.filter((f) => selectedIds.has(f.id))
        : localFriends

    if (listToExport.length === 0) {
      toast.error(t("friends_friends_tab_toast_export_no_data"))
      return
    }

    const headers = [
      t("friends_friends_tab_csv_header_index"),
      t("friends_friends_tab_csv_header_uid"),
      t("friends_friends_tab_csv_header_name"),
      t("friends_friends_tab_csv_header_gender"),
      t("friends_friends_tab_csv_header_mutual_friends"),
      t("friends_friends_tab_csv_header_url"),
      t("friends_friends_tab_csv_header_status")
    ]
    const csvRows = listToExport.map((f, idx) => [
      idx + 1,
      f.displayId,
      f.name,
      genderText(f.gender),
      f.mutualFriends,
      f.url,
      f.status === "Active"
        ? t("friends_friends_tab_status_active")
        : t("friends_friends_tab_status_locked")
    ])

    exportToCSV(headers, csvRows, `danh_sach_ban_be_${Date.now()}.csv`)
    toast.success(
      t("friends_friends_tab_toast_export_success", {
        count: listToExport.length
      })
    )
  }

  const bulkLabel = (type: BulkState["type"]) =>
    type === "unfriend"
      ? t("friends_friends_tab_bulk_status_unfriending")
      : type === "block"
        ? t("friends_friends_tab_bulk_status_blocking")
        : type === "restrict"
          ? t("friends_friends_tab_bulk_status_restricting")
          : type === "unrestrict"
            ? t("friends_friends_tab_bulk_status_unrestricting")
            : type === "poke"
              ? t("friends_friends_tab_bulk_status_poking")
              : t("friends_friends_tab_bulk_status_unblocking")

  const blockEffects = (
    <ul className="bm-list-inside bm-list-disc bm-space-y-1 bm-pl-1 bm-text-[12px] bm-text-fg-muted">
      <li>{t("friends_friends_tab_dialog_block_effect_1")}</li>
      <li>{t("friends_friends_tab_dialog_block_effect_2")}</li>
      <li>{t("friends_friends_tab_dialog_block_effect_3")}</li>
      <li>{t("friends_friends_tab_dialog_block_effect_4")}</li>
      <li>{t("friends_friends_tab_dialog_block_effect_5")}</li>
    </ul>
  )

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      {/* Toolbar */}
      <Toolbar>
        <div className="bm-flex bm-items-center bm-gap-2">
          <Input
            size="sm"
            className="bm-flex-1"
            placeholder={t("friends_friends_tab_search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            suffix={<Search size={13} />}
          />
          <div className="bm-flex bm-shrink-0 bm-items-center bm-overflow-hidden bm-rounded-lg bm-border bm-border-line bm-bg-surface">
            <IconButton
              size="sm"
              className="bm-rounded-none"
              label={t("friends_friends_tab_tooltip_refresh_list")}
              onClick={handleReload}>
              <History size={14} />
            </IconButton>
            <IconButton
              size="sm"
              className="bm-rounded-none"
              label={t("friends_friends_tab_tooltip_view_analytics")}
              onClick={() =>
                toast(t("friends_friends_tab_toast_analytics_wip"))
              }>
              <TrendingUp size={14} />
            </IconButton>
            <IconButton
              size="sm"
              className="bm-rounded-none"
              label={t("friends_friends_tab_tooltip_open_facebook")}
              onClick={() => window.open("https://facebook.com", "_blank")}>
              <ExternalLink size={14} />
            </IconButton>
          </div>
        </div>

        <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
          <Button
            size="xs"
            variant="primary"
            onClick={handleReload}
            disabled={state === "loading" || !!bulkRunning}
            icon={
              <RotateCw
                size={13}
                className={state === "loading" ? "bm-animate-spin" : ""}
              />
            }>
            {t("friends_friends_tab_btn_reload")}
          </Button>
          <Button
            size="xs"
            variant="success"
            onClick={handleExport}
            disabled={!!bulkRunning}
            icon={<Download size={13} />}>
            {t("friends_friends_tab_btn_export")} (
            {selectedIds.size > 0 ? selectedIds.size : localFriends.length})
          </Button>
        </div>

        {selectedIds.size > 0 && !bulkRunning && (
          <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-1.5">
            {bulkUnfriendTargets.length > 0 && (
              <Button
                size="xs"
                variant="outline"
                className="bm-border-warning/40 bm-text-warning"
                onClick={handleBulkUnfriend}
                icon={<UserMinus size={13} />}>
                {t("friends_friends_tab_btn_bulk_unfriend", {
                  count: bulkUnfriendTargets.length
                })}
              </Button>
            )}
            {bulkRestrictTargets.length > 0 && (
              <Button
                size="xs"
                variant="outline"
                className="bm-border-warning/40 bm-text-warning"
                onClick={() => setConfirmBulkRestrict(true)}
                icon={<EyeOff size={13} />}>
                {t("friends_friends_tab_btn_bulk_restrict", {
                  count: bulkRestrictTargets.length
                })}
              </Button>
            )}
            {bulkPokeTargets.length > 0 && (
              <Button
                size="xs"
                variant="outline"
                className="bm-border-indigo-500/40 bm-text-indigo-600 dark:bm-text-indigo-400"
                onClick={handleBulkPoke}
                icon={<Hand size={13} />}>
                {t("friends_friends_tab_btn_bulk_poke", {
                  count: bulkPokeTargets.length
                })}
              </Button>
            )}
            {bulkBlockMessageTargets.length > 0 && (
              <Button
                size="xs"
                variant="outline"
                className="bm-border-danger/40 bm-text-danger"
                onClick={() => setConfirmBulkBlockMessage(true)}
                icon={<MessageSquareOff size={13} />}>
                {t("friends_friends_tab_btn_bulk_block_message", {
                  count: bulkBlockMessageTargets.length
                })}
              </Button>
            )}
            {bulkUnrestrictTargets.length > 0 && (
              <Button
                size="xs"
                variant="outline"
                className="bm-border-success/40 bm-text-success"
                onClick={handleBulkUnrestrictFriends}
                icon={<Eye size={13} />}>
                {t("friends_friends_tab_btn_bulk_unrestrict", {
                  count: bulkUnrestrictTargets.length
                })}
              </Button>
            )}
            {bulkBlockTargets.length > 0 && (
              <Button
                size="xs"
                variant="danger"
                onClick={() => setConfirmBulkBlock(true)}
                icon={<Ban size={13} />}>
                {t("friends_friends_tab_btn_bulk_block", {
                  count: bulkBlockTargets.length
                })}
              </Button>
            )}
          </div>
        )}

        {bulkRunning && bulkRunning.type !== "unblock" && (
          <BulkProgress
            label={bulkLabel(bulkRunning.type)}
            bulk={bulkRunning}
            onStop={stopBulk}
            stopLabel={t("friends_shared_stop_tooltip")}
          />
        )}
      </Toolbar>

      {/* Table */}
      <TableShell>
        <thead className="bm-select-none bm-bg-surface-2/60">
          <tr>
            <th className={`${TH} bm-w-8 bm-text-center`}>
              <Checkbox
                size="sm"
                checked={
                  paginatedFriends.length > 0 &&
                  selectedIds.size === paginatedFriends.length
                }
                onChange={toggleSelectAll}
              />
            </th>
            <th className={`${TH} bm-w-8 bm-text-center`}>#</th>
            <th className={TH}>{t("friends_shared_col_name")}</th>
            <th className={TH}>{t("friends_shared_col_gender")}</th>
            <th className={TH}>
              {t("friends_friends_tab_col_mutual_friends")}
            </th>
            <th className={TH}>{t("friends_shared_col_status")}</th>
            <th className={`${TH} bm-text-center`}>
              {t("friends_shared_col_action")}
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedFriends.length > 0 ? (
            paginatedFriends.map((friend, index) => {
              const globalIndex = (currentPage - 1) * pageSize + index + 1
              const isSelected = selectedIds.has(friend.id)
              const isUnfriended = unfriendedIds.has(friend.id)
              const isBlocked = blockedIds.has(friend.id)
              const isRestricted = restrictedIds.has(friend.id)
              const isMessageBlocked = messageBlockedIds.has(friend.id)
              return (
                <tr key={friend.id} className={rowClass(isSelected)}>
                  <td className={`${TD} bm-text-center`}>
                    <Checkbox
                      size="sm"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(friend.id)}
                    />
                  </td>
                  <td
                    className={`${TD} bm-text-center bm-font-mono bm-text-fg-subtle`}>
                    {globalIndex}
                  </td>
                  <td className={TD}>
                    <UserCell
                      name={friend.name}
                      url={friend.url}
                      subId={friend.displayId}
                      pic={friend.profilePic}
                    />
                  </td>
                  <td className={`${TD} bm-whitespace-nowrap`}>
                    {genderText(friend.gender)}
                  </td>
                  <td
                    className={`${TD} bm-text-center bm-font-mono bm-text-fg-muted`}>
                    {friend.mutualFriends}
                  </td>
                  <td className={TD}>
                    <div className="bm-flex bm-flex-col bm-items-start bm-gap-1">
                      {isBlocked ? (
                        <Badge size="xs" tone="danger">
                          {t("friends_friends_tab_badge_blocked")}
                        </Badge>
                      ) : isUnfriended ? (
                        <Badge size="xs" tone="danger">
                          {t("friends_friends_tab_badge_unfriended")}
                        </Badge>
                      ) : friend.status === "Active" ? (
                        <Badge size="xs" tone="success">
                          {t("friends_friends_tab_badge_active")}
                        </Badge>
                      ) : (
                        <Badge size="xs" tone="warning">
                          {t("friends_friends_tab_badge_locked")}
                        </Badge>
                      )}
                      {isRestricted && !isBlocked && !isUnfriended && (
                        <Badge size="xs" tone="warning">
                          {t("friends_friends_tab_badge_restricted")}
                        </Badge>
                      )}
                      {isMessageBlocked && !isBlocked && !isUnfriended && (
                        <Badge size="xs" tone="danger">
                          {t("friends_friends_tab_badge_message_blocked")}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className={TD}>
                    <div className="bm-flex bm-items-center bm-justify-end bm-gap-1">
                      {isBlocked ? (
                        <Button
                          size="xs"
                          variant="outline"
                          icon={<Unlock size={12} />}
                          loading={unblockingIds.has(friend.id)}
                          onClick={() =>
                            setConfirmUnblockUser({
                              id: friend.id,
                              name: friend.name
                            })
                          }>
                          {t("friends_friends_tab_tooltip_unblock")}
                        </Button>
                      ) : isUnfriended ? (
                        <span className="bm-whitespace-nowrap bm-text-[11.5px] bm-text-fg-subtle">
                          {t("friends_friends_tab_tooltip_already_unfriended")}
                        </span>
                      ) : (
                        <>
                          <Button
                            size="xs"
                            variant="outline"
                            className="bm-whitespace-nowrap bm-text-danger hover:bm-bg-danger-soft"
                            icon={<UserMinus size={12} />}
                            loading={unfriendingIds.has(friend.id)}
                            onClick={() =>
                              handleUnfriendOne(friend.id, friend.name)
                            }>
                            {t("friends_friends_tab_tooltip_unfriend")}
                          </Button>
                          <FriendRowMenu
                            moreLabel={t("friends_friends_tab_more_actions")}
                            busy={
                              restrictingIds.has(friend.id) ||
                              unrestrictingIds.has(friend.id) ||
                              blockingMessageIds.has(friend.id) ||
                              unblockingMessageIds.has(friend.id) ||
                              pokingIds.has(friend.id) ||
                              blockingIds.has(friend.id)
                            }
                            items={[
                              isRestricted
                                ? {
                                    key: "unrestrict",
                                    icon: <Eye size={14} />,
                                    label: t(
                                      "friends_friends_tab_tooltip_unrestrict"
                                    ),
                                    onClick: () =>
                                      setConfirmUnrestrictUser({
                                        id: friend.id,
                                        name: friend.name
                                      })
                                  }
                                : {
                                    key: "restrict",
                                    icon: <EyeOff size={14} />,
                                    label: t(
                                      "friends_friends_tab_tooltip_restrict"
                                    ),
                                    onClick: () =>
                                      setConfirmRestrictUser({
                                        id: friend.id,
                                        name: friend.name
                                      })
                                  },
                              isMessageBlocked
                                ? {
                                    key: "unblock-message",
                                    icon: <MessageSquare size={14} />,
                                    label: t(
                                      "friends_friends_tab_tooltip_unblock_message"
                                    ),
                                    onClick: () =>
                                      setConfirmUnblockMessageUser({
                                        id: friend.id,
                                        name: friend.name
                                      })
                                  }
                                : {
                                    key: "block-message",
                                    icon: <MessageSquareOff size={14} />,
                                    label: t(
                                      "friends_friends_tab_tooltip_block_message"
                                    ),
                                    onClick: () =>
                                      setConfirmBlockMessageUser({
                                        id: friend.id,
                                        name: friend.name
                                      })
                                  },
                              {
                                key: "poke",
                                icon: <Hand size={14} />,
                                label: t("friends_friends_tab_tooltip_poke"),
                                onClick: () =>
                                  handlePokeOne(friend.id, friend.name)
                              },
                              {
                                key: "block",
                                icon: <Ban size={14} />,
                                label: t("friends_friends_tab_tooltip_block"),
                                danger: true,
                                divider: true,
                                onClick: () =>
                                  setConfirmBlockUser({
                                    id: friend.id,
                                    name: friend.name
                                  })
                              }
                            ]}
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td
                colSpan={7}
                className="bm-p-8 bm-text-center bm-italic bm-text-fg-muted">
                {t("friends_friends_tab_no_data")}
              </td>
            </tr>
          )}
        </tbody>
      </TableShell>

      <TableFacebookPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredFriends.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Confirmation dialogs */}
      <ConfirmDialog
        open={!!confirmUnfriendUser}
        onOpenChange={(open) => !open && setConfirmUnfriendUser(null)}
        title={t("friends_friends_tab_dialog_unfriend_title", { name: confirmUnfriendUser?.name ?? "" })}
        description={t("friends_friends_tab_dialog_unfriend_desc")}
        cancelText={t("friends_friends_tab_dialog_cancel")}
        confirmText={t("friends_friends_tab_tooltip_unfriend")}
        destructive
        onConfirm={() => {
          if (confirmUnfriendUser) void handleUnfriendOne(confirmUnfriendUser.id, confirmUnfriendUser.name)
        }}
      />
      <ConfirmDialog
        open={!!confirmBlockUser}
        onOpenChange={(open) => !open && setConfirmBlockUser(null)}
        title={t("friends_friends_tab_dialog_block_title", {
          name: confirmBlockUser?.name ?? ""
        })}
        cancelText={t("friends_friends_tab_dialog_cancel")}
        confirmText={t("friends_friends_tab_dialog_confirm_block")}
        destructive
        onConfirm={handleConfirmBlockOne}>
        <div className="bm-flex bm-flex-col bm-gap-2.5 bm-text-[12.5px]">
          <p className="bm-font-semibold bm-text-danger">
            {t("friends_friends_tab_dialog_block_intro", {
              name: confirmBlockUser?.name ?? ""
            })}
          </p>
          {blockEffects}
          <p className="bm-border-t bm-border-line bm-pt-2 bm-text-[11.5px] bm-text-fg-muted">
            {t("friends_friends_tab_dialog_block_note", {
              name: confirmBlockUser?.name ?? ""
            })}
          </p>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmBulkBlock}
        onOpenChange={(open) => !open && setConfirmBulkBlock(false)}
        title={t("friends_friends_tab_dialog_bulk_block_title", {
          count: bulkBlockTargets.length
        })}
        cancelText={t("friends_friends_tab_dialog_cancel")}
        confirmText={t("friends_friends_tab_dialog_confirm_bulk_block")}
        destructive
        onConfirm={handleConfirmBulkBlock}>
        <div className="bm-flex bm-flex-col bm-gap-2.5 bm-text-[12.5px]">
          <p className="bm-font-semibold bm-text-danger">
            {t("friends_friends_tab_dialog_bulk_block_intro")}
          </p>
          {blockEffects}
          <p className="bm-border-t bm-border-line bm-pt-2 bm-text-[11.5px] bm-text-fg-muted">
            {t("friends_friends_tab_dialog_bulk_block_note")}
          </p>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!confirmUnblockUser}
        onOpenChange={(open) => !open && setConfirmUnblockUser(null)}
        title={t("friends_friends_tab_dialog_unblock_title", {
          name: confirmUnblockUser?.name ?? ""
        })}
        description={t("friends_friends_tab_dialog_unblock_desc", {
          name: confirmUnblockUser?.name ?? ""
        })}
        cancelText={t("friends_friends_tab_dialog_cancel")}
        confirmText={t("friends_friends_tab_dialog_confirm_unblock")}
        onConfirm={handleConfirmUnblockOne}>
        <p className="bm-text-[12px] bm-font-semibold bm-text-warning">
          {t("friends_friends_tab_dialog_unblock_warning")}
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!confirmRestrictUser}
        onOpenChange={(open) => !open && setConfirmRestrictUser(null)}
        title={t("friends_friends_tab_dialog_restrict_title", {
          name: confirmRestrictUser?.name ?? ""
        })}
        cancelText={t("friends_friends_tab_dialog_cancel")}
        confirmText={t("friends_friends_tab_dialog_confirm_restrict")}
        onConfirm={handleConfirmRestrictOne}>
        <div className="bm-flex bm-flex-col bm-gap-2 bm-text-[12.5px]">
          <p className="bm-font-semibold bm-text-warning">
            {t("friends_friends_tab_dialog_restrict_intro", {
              name: confirmRestrictUser?.name ?? ""
            })}
          </p>
          <p className="bm-text-fg-muted">
            {t("friends_friends_tab_dialog_restrict_desc")}
          </p>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmBulkRestrict}
        onOpenChange={(open) => !open && setConfirmBulkRestrict(false)}
        title={t("friends_friends_tab_dialog_bulk_restrict_title", {
          count: bulkRestrictTargets.length
        })}
        cancelText={t("friends_friends_tab_dialog_cancel")}
        confirmText={t("friends_friends_tab_dialog_confirm_bulk_restrict")}
        onConfirm={handleConfirmBulkRestrict}>
        <div className="bm-flex bm-flex-col bm-gap-2 bm-text-[12.5px]">
          <p className="bm-font-semibold bm-text-warning">
            {t("friends_friends_tab_dialog_bulk_restrict_intro")}
          </p>
          <p className="bm-text-fg-muted">
            {t("friends_friends_tab_dialog_restrict_desc")}
          </p>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!confirmUnrestrictUser}
        onOpenChange={(open) => !open && setConfirmUnrestrictUser(null)}
        title={t("friends_friends_tab_dialog_unrestrict_title", {
          name: confirmUnrestrictUser?.name ?? ""
        })}
        description={t("friends_friends_tab_dialog_unrestrict_desc", {
          name: confirmUnrestrictUser?.name ?? ""
        })}
        cancelText={t("friends_friends_tab_dialog_cancel")}
        confirmText={t("friends_friends_tab_dialog_confirm_unrestrict")}
        onConfirm={handleConfirmUnrestrictOne}>
        <p className="bm-text-[12px] bm-text-fg-muted">
          {t("friends_friends_tab_dialog_unrestrict_note")}
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!confirmBlockMessageUser}
        onOpenChange={(open) => !open && setConfirmBlockMessageUser(null)}
        title={t("friends_friends_tab_dialog_block_message_title", {
          name: confirmBlockMessageUser?.name ?? ""
        })}
        description={t("friends_friends_tab_dialog_block_message_desc", {
          name: confirmBlockMessageUser?.name ?? ""
        })}
        cancelText={t("friends_friends_tab_dialog_cancel")}
        confirmText={t("friends_friends_tab_dialog_confirm_block")}
        destructive
        onConfirm={handleConfirmBlockMessageOne}
      />

      <ConfirmDialog
        open={!!confirmUnblockMessageUser}
        onOpenChange={(open) => !open && setConfirmUnblockMessageUser(null)}
        title={t("friends_friends_tab_dialog_unblock_message_title", {
          name: confirmUnblockMessageUser?.name ?? ""
        })}
        description={t("friends_friends_tab_dialog_unblock_message_desc", {
          name: confirmUnblockMessageUser?.name ?? ""
        })}
        cancelText={t("friends_friends_tab_dialog_cancel")}
        confirmText={t("friends_friends_tab_dialog_confirm_unblock")}
        onConfirm={handleConfirmUnblockMessageOne}
      />

      <ConfirmDialog
        open={confirmBulkBlockMessage}
        onOpenChange={(open) => !open && setConfirmBulkBlockMessage(false)}
        title={t("friends_friends_tab_dialog_bulk_block_message_title", {
          count: bulkBlockMessageTargets.length
        })}
        description={t("friends_friends_tab_dialog_bulk_block_message_desc")}
        cancelText={t("friends_friends_tab_dialog_cancel")}
        confirmText={t("friends_friends_tab_dialog_confirm_bulk_block_message")}
        destructive
        onConfirm={handleConfirmBulkBlockMessage}
      />
    </div>
  )
}
