import { normalizeForSearch } from "src/configs/tools.config"
import { Eye, RotateCw, Search, Unlock } from "lucide-react"
import { Dispatch, MutableRefObject, ReactNode, SetStateAction, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { TableFacebookPagination } from "src/modules/facebook/components/TablePagination"
import { runFacebookBulkAction } from "src/modules/facebook/utils/bulk-action.util"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import type { FriendsBulkState as BulkState } from "src/modules/facebook/types/bulk.types"
import { Badge, Button, Checkbox, ConfirmDialog, Input } from "src/modules/shared/ui"

import type { BlockedUser, RestrictedUser } from "src/modules/account/types/friends.types"
import {
  addToSet,
  BulkProgress,
  genderLabel,
  LoadFn,
  LoadState,
  removeFromSet,
  rowClass,
  RowAction,
  TableShell,
  TD,
  TH,
  Toolbar,
  UserCell
} from "src/modules/account/components/friends/FriendsTableParts"

/**
 * The source has three near-identical tabs (RestrictedTab, BlockedTab,
 * MessageBlockedTab). They are driven by one component here; every string,
 * action and condition of the originals is kept in the per-tab config below.
 */
interface BlockeeConfig {
  ns: "restricted" | "blocked" | "message_blocked"
  actionType: "unrestrict" | "unblock"
  rowIcon: ReactNode
  /** Whether the shared bulk progress belongs to this tab + its label. */
  progressLabel: (bulk: BulkState, t: TFunction) => string | null
  bulkButtonKey: string
  toastSuccessKey: string
  toastFailedKey: string
  toastBulkKey: string
  statusDoneKey: string
  statusPendingKey: string
  pendingTone: "warning" | "danger"
  tooltipPendingKey: string
  confirmActionKey: string
  dialogExtra?: (t: TFunction) => ReactNode
}

const CONFIGS: Record<BlockeeConfig["ns"], BlockeeConfig> = {
  restricted: {
    ns: "restricted",
    actionType: "unrestrict",
    rowIcon: <Eye size={13} />,
    progressLabel: (bulk, t) =>
      bulk.type === "restrict"
        ? t("friends_restricted_bulk_running_label_restrict")
        : bulk.type === "unrestrict"
          ? t("friends_restricted_bulk_running_label_unrestrict")
          : null,
    bulkButtonKey: "friends_restricted_bulk_unrestrict_button",
    toastSuccessKey: "friends_restricted_toast_unrestrict_success",
    toastFailedKey: "friends_restricted_toast_unrestrict_failed",
    toastBulkKey: "friends_restricted_toast_bulk_unrestrict_result",
    statusDoneKey: "friends_restricted_status_unrestricted",
    statusPendingKey: "friends_restricted_status_restricted",
    pendingTone: "warning",
    tooltipPendingKey: "friends_restricted_unrestrict_action",
    confirmActionKey: "friends_restricted_confirm_unrestrict_action",
    dialogExtra: (t) => (
      <p className="bm-text-[12px] bm-text-fg-muted">{t("friends_restricted_confirm_dialog_note")}</p>
    )
  },
  blocked: {
    ns: "blocked",
    actionType: "unblock",
    rowIcon: <Unlock size={13} />,
    progressLabel: (bulk, t) => (bulk.type === "unblock" ? t("friends_blocked_bulk_running_label") : null),
    bulkButtonKey: "friends_blocked_bulk_unblock_button",
    toastSuccessKey: "friends_blocked_toast_unblock_success",
    toastFailedKey: "friends_blocked_toast_unblock_failed",
    toastBulkKey: "friends_blocked_toast_bulk_unblock_result",
    statusDoneKey: "friends_blocked_status_unblocked",
    statusPendingKey: "friends_blocked_status_blocked",
    pendingTone: "danger",
    tooltipPendingKey: "friends_blocked_status_blocked",
    confirmActionKey: "friends_blocked_confirm_unblock_action",
    dialogExtra: (t) => (
      <p className="bm-text-[12px] bm-font-semibold bm-text-warning">
        {t("friends_blocked_confirm_dialog_warning")}
      </p>
    )
  },
  message_blocked: {
    ns: "message_blocked",
    actionType: "unblock",
    rowIcon: <Unlock size={13} />,
    progressLabel: (bulk, t) =>
      bulk.type === "unblock" ? t("friends_message_blocked_bulk_running_label") : null,
    bulkButtonKey: "friends_message_blocked_bulk_unblock_button",
    toastSuccessKey: "friends_message_blocked_toast_unblock_success",
    toastFailedKey: "friends_message_blocked_toast_unblock_failed",
    toastBulkKey: "friends_message_blocked_toast_bulk_unblock_result",
    statusDoneKey: "friends_message_blocked_status_unblocked",
    statusPendingKey: "friends_message_blocked_status_blocked",
    pendingTone: "danger",
    tooltipPendingKey: "friends_message_blocked_status_blocked",
    confirmActionKey: "friends_message_blocked_confirm_unblock_action"
  }
}

interface BlockeeTabProps {
  config: BlockeeConfig
  users: (BlockedUser | RestrictedUser)[]
  loadState: LoadState
  loadUsers: LoadFn
  /** Undo action for one user (unrestrict / unblock / unblock messages). */
  undo: (id: string) => Promise<boolean>
  bulkRunning: BulkState | null
  setBulkRunning: Dispatch<SetStateAction<BulkState | null>>
  bulkStopRef: MutableRefObject<boolean>
  onDone?: (id: string) => void
}

function BlockeeTab({
  config,
  users,
  loadState,
  loadUsers,
  undo,
  bulkRunning,
  setBulkRunning,
  bulkStopRef,
  onDone
}: BlockeeTabProps) {
  const { t } = useTranslation()
  const ns = `friends_${config.ns}`
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())
  const [confirmUser, setConfirmUser] = useState<{ id: string; name: string } | null>(null)

  const handleReload = () => {
    loadUsers({ cursor: null, accumulate: false, forceRefresh: true })
  }

  const filtered = useMemo(() => {
    const query = normalizeForSearch(searchQuery)
    return users.filter(
      (user) =>
        normalizeForSearch(user.name).includes(query) || user.id.includes(query) || normalizeForSearch(user.gender).includes(query)
    )
  }, [users, searchQuery])

  const paginated = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filtered.slice(startIndex, startIndex + pageSize)
  }, [filtered, currentPage, pageSize])

  const totalPages = Math.ceil(filtered.length / pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set())
    } else {
      const newSelection = new Set<string>()
      paginated.forEach((u) => newSelection.add(u.id))
      setSelectedIds(newSelection)
    }
  }

  const toggleSelectOne = (id: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(id)) newSelection.delete(id)
    else newSelection.add(id)
    setSelectedIds(newSelection)
  }

  const handleConfirmOne = async () => {
    if (!confirmUser) return
    const { id, name } = confirmUser
    setConfirmUser(null)
    setBusyIds((prev) => addToSet(prev, id))
    const success = await undo(id)
    setBusyIds((prev) => removeFromSet(prev, id))
    if (success) {
      setDoneIds((prev) => addToSet(prev, id))
      onDone?.(id)
      toast.success(t(config.toastSuccessKey, { name }))
    } else {
      toast.error(t(config.toastFailedKey, { name }))
    }
  }

  const bulkTargets = useMemo(() => Array.from(selectedIds).filter((id) => !doneIds.has(id)), [selectedIds, doneIds])

  const handleBulk = async () => {
    const targets = bulkTargets
    if (targets.length === 0) return
    await runFacebookBulkAction({
      targets,
      actionType: config.actionType,
      bulkStopRef,
      setBulkRunning,
      executeSingle: async (id) => {
        setBusyIds((prev) => addToSet(prev, id))
        const ok = await undo(id)
        setBusyIds((prev) => removeFromSet(prev, id))
        if (ok) {
          setDoneIds((prev) => addToSet(prev, id))
          onDone?.(id)
          return true
        }
        return false
      },
      onFinished: (success, fail) => {
        setSelectedIds(new Set())
        toast.success(t(config.toastBulkKey, { success, fail }))
      }
    })
  }

  const stopBulk = () => {
    bulkStopRef.current = true
  }

  const progressLabel = bulkRunning ? config.progressLabel(bulkRunning, t) : null

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      <Toolbar>
        <Input
          size="sm"
          placeholder={t(`${ns}_search_placeholder`)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          suffix={<Search size={13} />}
        />
        <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
          <Button
            size="xs"
            variant="primary"
            onClick={handleReload}
            disabled={loadState === "loading" || !!bulkRunning}
            icon={<RotateCw size={13} className={loadState === "loading" ? "bm-animate-spin" : ""} />}>
            {t(`${ns}_reload_button`)}
          </Button>

          {bulkTargets.length > 0 && !bulkRunning && (
            <Button size="xs" variant="success" onClick={handleBulk} icon={<Unlock size={13} />}>
              {t(config.bulkButtonKey, { count: bulkTargets.length })}
            </Button>
          )}
        </div>

        {bulkRunning && progressLabel && (
          <BulkProgress
            label={progressLabel}
            bulk={bulkRunning}
            onStop={stopBulk}
            stopLabel={t("friends_shared_stop_tooltip")}
          />
        )}
      </Toolbar>

      <TableShell>
        <thead className="bm-select-none bm-bg-surface-2/60">
          <tr>
            <th className={`${TH} bm-w-8 bm-text-center`}>
              <Checkbox
                size="sm"
                checked={paginated.length > 0 && selectedIds.size === paginated.length}
                onChange={toggleSelectAll}
              />
            </th>
            <th className={`${TH} bm-w-8 bm-text-center`}>#</th>
            <th className={TH}>{t("friends_shared_col_name")}</th>
            <th className={TH}>{t("friends_shared_col_gender")}</th>
            <th className={TH}>{t("friends_shared_col_status")}</th>
            <th className={`${TH} bm-text-center`}>{t("friends_shared_col_action")}</th>
          </tr>
        </thead>
        <tbody>
          {paginated.length > 0 ? (
            paginated.map((user, index) => {
              const globalIndex = (currentPage - 1) * pageSize + index + 1
              const isSelected = selectedIds.has(user.id)
              const isDone = doneIds.has(user.id)
              return (
                <tr key={user.id} className={rowClass(isSelected)}>
                  <td className={`${TD} bm-text-center`}>
                    <Checkbox size="sm" checked={isSelected} onChange={() => toggleSelectOne(user.id)} />
                  </td>
                  <td className={`${TD} bm-text-center bm-font-mono bm-text-fg-subtle`}>{globalIndex}</td>
                  <td className={TD}>
                    <UserCell
                      name={user.name}
                      url={`https://facebook.com/${user.id}`}
                      subId={user.id}
                      pic={user.profilePic}
                    />
                  </td>
                  <td className={`${TD} bm-whitespace-nowrap`}>
                    {genderLabel(t, user.gender, t("friends_shared_gender_unknown"))}
                  </td>
                  <td className={TD}>
                    {isDone ? (
                      <Badge size="xs" tone="success">
                        {t(config.statusDoneKey)}
                      </Badge>
                    ) : (
                      <Badge size="xs" tone={config.pendingTone}>
                        {t(config.statusPendingKey)}
                      </Badge>
                    )}
                  </td>
                  <td className={`${TD} bm-text-center`}>
                    <RowAction
                      tone="success"
                      muted={isDone}
                      icon={config.rowIcon}
                      busy={busyIds.has(user.id)}
                      disabled={busyIds.has(user.id) || isDone}
                      label={isDone ? t(config.statusDoneKey) : t(config.tooltipPendingKey)}
                      onClick={() => setConfirmUser({ id: user.id, name: user.name })}
                    />
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={6} className="bm-p-8 bm-text-center bm-italic bm-text-fg-muted">
                {t(`${ns}_empty_table`)}
              </td>
            </tr>
          )}
        </tbody>
      </TableShell>

      <TableFacebookPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filtered.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <ConfirmDialog
        open={!!confirmUser}
        onOpenChange={(open) => !open && setConfirmUser(null)}
        title={t(`${ns}_confirm_dialog_title`, { name: confirmUser?.name ?? "" })}
        description={t(`${ns}_confirm_dialog_desc`, { name: confirmUser?.name ?? "" })}
        cancelText={t("shared_cancel")}
        confirmText={t(config.confirmActionKey)}
        onConfirm={handleConfirmOne}>
        {config.dialogExtra?.(t)}
      </ConfirmDialog>
    </div>
  )
}

type SharedBulkProps = Pick<BlockeeTabProps, "bulkRunning" | "setBulkRunning" | "bulkStopRef">

export function RestrictedTab(
  props: SharedBulkProps & {
    restrictedUsers: RestrictedUser[]
    restrictedState: LoadState
    loadRestrictedUsers: LoadFn
    restrict: (id: string, action: "BLOCK" | "UNBLOCK") => Promise<boolean>
    onUnrestricted?: (id: string) => void
  }
) {
  const { restrictedUsers, restrictedState, loadRestrictedUsers, restrict, onUnrestricted, ...bulk } = props
  return (
    <BlockeeTab
      config={CONFIGS.restricted}
      users={restrictedUsers}
      loadState={restrictedState}
      loadUsers={loadRestrictedUsers}
      undo={(id) => restrict(id, "UNBLOCK")}
      onDone={onUnrestricted}
      {...bulk}
    />
  )
}

export function BlockedTab(
  props: SharedBulkProps & {
    blockedUsers: BlockedUser[]
    blockedState: LoadState
    loadBlockedUsers: LoadFn
    unblock: (id: string) => Promise<boolean>
  }
) {
  const { blockedUsers, blockedState, loadBlockedUsers, unblock, ...bulk } = props
  return (
    <BlockeeTab
      config={CONFIGS.blocked}
      users={blockedUsers}
      loadState={blockedState}
      loadUsers={loadBlockedUsers}
      undo={unblock}
      {...bulk}
    />
  )
}

export function MessageBlockedTab(
  props: SharedBulkProps & {
    messageBlockedUsers: BlockedUser[]
    messageBlockedState: LoadState
    loadMessageBlockedUsers: LoadFn
    blockMessage: (id: string, action: "BLOCK" | "UNBLOCK") => Promise<boolean>
    onUnblocked?: (id: string) => void
  }
) {
  const { messageBlockedUsers, messageBlockedState, loadMessageBlockedUsers, blockMessage, onUnblocked, ...bulk } =
    props
  return (
    <BlockeeTab
      config={CONFIGS.message_blocked}
      users={messageBlockedUsers}
      loadState={messageBlockedState}
      loadUsers={loadMessageBlockedUsers}
      undo={(id) => blockMessage(id, "UNBLOCK")}
      onDone={onUnblocked}
      {...bulk}
    />
  )
}
