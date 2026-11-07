import {
  Check,
  Download,
  ExternalLink,
  History,
  RotateCw,
  Search,
  SlidersHorizontal,
  Square,
  TrendingUp,
  X
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { normalizeForSearch } from "src/configs/tools.config"
import { useFriendRequests } from "src/modules/account/hooks/useFriendRequests"
import { TableFacebookPagination } from "src/modules/facebook/components/TablePagination"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import type { BulkState } from "src/modules/facebook/types/bulk.types"
import { runFacebookBulkAction } from "src/modules/facebook/utils/bulk-action.util"
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  cn,
  ConfirmDialog,
  IconButton,
  Input,
  Select,
  Spinner
} from "src/modules/shared/ui"
import { exportToCSV } from "src/utils/export.util"

type ActionType = "accept" | "delete"
type FriendRequestsBulkState = BulkState<ActionType>
type FilterMutual = "all" | "mutual" | "no_mutual"
type SortBy = "newest" | "oldest"

export function FriendRequestsPanel() {
  const { t } = useTranslation()
  const { profile } = useFacebook()
  const {
    error,
    friendRequests,
    friendRequestsState,
    friendRequestsTotalCount,
    loadFriendRequests,
    confirmFriendRequest,
    deleteFriendRequest
  } = useFriendRequests()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Advanced filters
  const [filterMutual, setFilterMutual] = useState<FilterMutual>("all")
  const [sortBy, setSortBy] = useState<SortBy>("newest")

  // Action states
  const [processedIds, setProcessedIds] = useState<
    Map<string, "accepted" | "deleted">
  >(new Map())
  const [processingIds, setProcessingIds] = useState<Map<string, ActionType>>(
    new Map()
  )
  const [confirmActionUser, setConfirmActionUser] = useState<{
    id: string
    name: string
    type: ActionType
  } | null>(null)
  const [bulkConfirmType, setBulkConfirmType] = useState<ActionType | null>(
    null
  )

  // Bulk state
  const bulkStopRef = useRef<boolean>(false)
  const [bulkRunning, setBulkRunning] =
    useState<FriendRequestsBulkState | null>(null)

  useEffect(() => {
    if (profile?.uid) {
      loadFriendRequests({ cursor: null, accumulate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid])

  const handleReload = () => {
    setSelectedIds(new Set())
    setProcessedIds(new Map())
    loadFriendRequests({ cursor: null, accumulate: false, forceRefresh: true })
  }

  // Filter and Sort requests
  const filteredRequests = useMemo(() => {
    let list = [...friendRequests]

    // 1. Search Query filter
    if (searchQuery.trim()) {
      const query = normalizeForSearch(searchQuery)
      list = list.filter(
        (req) =>
          normalizeForSearch(req.name).includes(query) ||
          req.id.includes(query) ||
          normalizeForSearch(req.socialContext).includes(query)
      )
    }

    // 2. Smart filtering (mutual friends)
    const mutualKey = normalizeForSearch("bạn chung")
    if (filterMutual === "mutual") {
      list = list.filter((req) =>
        normalizeForSearch(req.socialContext).includes(mutualKey)
      )
    } else if (filterMutual === "no_mutual") {
      list = list.filter(
        (req) => !normalizeForSearch(req.socialContext).includes(mutualKey)
      )
    }

    // 3. Sorting
    list.sort((a, b) =>
      sortBy === "newest" ? b.time - a.time : a.time - b.time
    )

    return list
  }, [friendRequests, searchQuery, filterMutual, sortBy])

  // Pagination
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredRequests.slice(startIndex, startIndex + pageSize)
  }, [filteredRequests, currentPage, pageSize])

  const totalPages = Math.ceil(filteredRequests.length / pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterMutual, sortBy, pageSize])

  // Selection
  const selectablePageCount = paginatedRequests.filter(
    (r) => !processedIds.has(r.id)
  ).length
  const allPageSelected =
    paginatedRequests.length > 0 && selectedIds.size === selectablePageCount

  const toggleSelectAll = () => {
    if (selectedIds.size === selectablePageCount) {
      setSelectedIds(new Set())
    } else {
      const newSelection = new Set<string>()
      paginatedRequests.forEach((r) => {
        if (!processedIds.has(r.id)) {
          newSelection.add(r.id)
        }
      })
      setSelectedIds(newSelection)
    }
  }

  const toggleSelectOne = (id: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedIds(newSelection)
  }

  const markProcessing = (id: string, type: ActionType) =>
    setProcessingIds((prev) => new Map(prev).set(id, type))
  const unmarkProcessing = (id: string) =>
    setProcessingIds((prev) => {
      const m = new Map(prev)
      m.delete(id)
      return m
    })
  const markProcessed = (id: string, type: ActionType) => {
    setProcessedIds((prev) => {
      const next = new Map(prev)
      next.set(id, type === "accept" ? "accepted" : "deleted")
      return next
    })
    setSelectedIds((prev) => {
      const s = new Set(prev)
      s.delete(id)
      return s
    })
  }

  // Single Action handler
  const handleSingleAction = (id: string, name: string, type: ActionType) => {
    setConfirmActionUser({ id, name, type })
  }

  const handleConfirmSingleAction = async () => {
    if (!confirmActionUser) return
    const { id, name, type } = confirmActionUser
    setConfirmActionUser(null)
    markProcessing(id, type)

    const success =
      type === "accept"
        ? await confirmFriendRequest(id)
        : await deleteFriendRequest(id)

    unmarkProcessing(id)

    if (success) {
      markProcessed(id, type)
      toast.success(
        type === "accept"
          ? t("friend_requests_toast_accept_success", { name })
          : t("friend_requests_toast_delete_success", { name })
      )
    } else {
      toast.error(
        type === "accept"
          ? t("friend_requests_toast_accept_failed", { name })
          : t("friend_requests_toast_delete_failed", { name })
      )
    }
  }

  // Bulk Action handler
  const bulkTargets = useMemo(
    () => Array.from(selectedIds).filter((id) => !processedIds.has(id)),
    [selectedIds, processedIds]
  )

  const handleBulkClick = (type: ActionType) => {
    if (bulkTargets.length === 0) return
    setBulkConfirmType(type)
  }

  const handleConfirmBulkAction = async () => {
    const type = bulkConfirmType
    setBulkConfirmType(null)
    if (!type) return

    const targets = bulkTargets
    if (targets.length === 0) return

    await runFacebookBulkAction({
      targets,
      actionType: type,
      bulkStopRef,
      setBulkRunning,
      executeSingle: async (id) => {
        markProcessing(id, type)
        const ok =
          type === "accept"
            ? await confirmFriendRequest(id)
            : await deleteFriendRequest(id)
        unmarkProcessing(id)
        if (ok) {
          markProcessed(id, type)
          return true
        }
        return false
      },
      onFinished: (success, fail) => {
        toast.success(
          type === "accept"
            ? t("friend_requests_toast_bulk_accept_result", { success, fail })
            : t("friend_requests_toast_bulk_delete_result", { success, fail })
        )
      }
    })
  }

  const stopBulk = () => {
    bulkStopRef.current = true
  }

  // Export CSV
  const handleExport = () => {
    const listToExport =
      selectedIds.size > 0
        ? friendRequests.filter((r) => selectedIds.has(r.id))
        : friendRequests

    if (listToExport.length === 0) {
      toast.error(t("friend_requests_toast_export_empty"))
      return
    }

    const headers = [
      t("friend_requests_csv_header_index"),
      t("friend_requests_csv_header_uid"),
      t("friend_requests_csv_header_name"),
      t("friend_requests_csv_header_mutual"),
      t("friend_requests_csv_header_url"),
      t("friend_requests_csv_header_status")
    ]
    const csvRows = listToExport.map((r, idx) => {
      const status = processedIds.get(r.id)
      const statusText =
        status === "accepted"
          ? t("friend_requests_status_accepted")
          : status === "deleted"
            ? t("friend_requests_status_deleted")
            : t("friend_requests_status_pending")

      return [idx + 1, r.id, r.name, r.socialContext, r.url, statusText]
    })

    exportToCSV(headers, csvRows, `yeu_cau_ket_ban_den_${Date.now()}.csv`)
    toast.success(
      t("friend_requests_toast_export_success", { count: listToExport.length })
    )
  }

  const formatTime = (timeSec: number) => {
    if (!timeSec) return "---"
    const date = new Date(timeSec * 1000)
    return date.toLocaleDateString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  const isLoading = friendRequestsState === "loading"
  const th =
    "bm-px-2 bm-py-2 bm-text-left bm-text-[11px] bm-font-semibold bm-uppercase bm-tracking-wide bm-text-fg-subtle"

  return (
    <div className="bm-flex bm-w-full bm-flex-col bm-gap-3 bm-rounded-xl bm-border bm-border-line bm-bg-surface bm-p-3 bm-text-fg">
      {/* Header */}
      <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
        <h2 className="bm-text-[14px] bm-font-semibold">
          {t("friend_requests_title")}
        </h2>
        <Badge tone="success">
          {t("friend_requests_loaded_count", {
            loaded: friendRequests.length,
            total:
              friendRequestsTotalCount > 0 ? `/${friendRequestsTotalCount}` : ""
          })}
        </Badge>
      </div>

      {/* Filters & Search */}
      <div className="bm-flex bm-flex-col bm-gap-2 bm-rounded-lg bm-border bm-border-line bm-bg-surface-2/50 bm-p-2.5">
        <Input
          size="sm"
          type="text"
          placeholder={t("friend_requests_search_placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          suffix={<Search size={14} />}
        />
        <div className="bm-grid bm-grid-cols-2 bm-gap-2">
          <Select<FilterMutual>
            size="sm"
            value={filterMutual}
            onChange={setFilterMutual}
            placeholder={t("friend_requests_filter_mutual_placeholder")}
            prefix={<SlidersHorizontal size={13} />}
            options={[
              { value: "all", label: t("friend_requests_filter_mutual_all") },
              {
                value: "mutual",
                label: t("friend_requests_filter_mutual_has")
              },
              {
                value: "no_mutual",
                label: t("friend_requests_filter_mutual_none")
              }
            ]}
          />
          <Select<SortBy>
            size="sm"
            value={sortBy}
            onChange={setSortBy}
            placeholder={t("friend_requests_sort_placeholder")}
            options={[
              { value: "newest", label: t("friend_requests_sort_newest") },
              { value: "oldest", label: t("friend_requests_sort_oldest") }
            ]}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="bm-flex bm-flex-col bm-gap-2 bm-rounded-lg bm-border bm-border-line bm-bg-surface-2/50 bm-p-2.5">
        <div className="bm-flex bm-items-center bm-justify-between bm-gap-2">
          <div className="bm-text-[12px] bm-font-medium bm-text-fg-muted">
            {t("friend_requests_selected_count_label")}{" "}
            <span className="bm-font-mono bm-font-semibold bm-text-fg">
              {selectedIds.size}
            </span>
          </div>

          {/* Secondary Actions Group */}
          <div className="bm-flex bm-items-center bm-gap-0.5">
            <IconButton
              tooltip={t("friend_requests_reload_tooltip")}
              size="xs"
              label={t("friend_requests_reload_tooltip")}
              onClick={handleReload}
              disabled={isLoading || !!bulkRunning}>
              <History size={14} />
            </IconButton>
            <IconButton
              tooltip={t("friend_requests_analytics_tooltip")}
              size="xs"
              label={t("friend_requests_analytics_tooltip")}
              onClick={() =>
                toast(t("friend_requests_toast_feature_developing"))
              }>
              <TrendingUp size={14} />
            </IconButton>
            <IconButton
              tooltip={t("friend_requests_open_facebook_friends_tooltip")}
              size="xs"
              label={t("friend_requests_open_facebook_friends_tooltip")}
              onClick={() =>
                window.open("https://facebook.com/friends", "_blank")
              }>
              <ExternalLink size={14} />
            </IconButton>
          </div>
        </div>

        <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
          <Button
            size="xs"
            variant="primary"
            onClick={handleReload}
            disabled={isLoading || !!bulkRunning}
            icon={
              <RotateCw
                size={13}
                className={cn(isLoading && "bm-animate-spin")}
              />
            }>
            {t("friend_requests_reload_button")}
          </Button>

          <Button
            size="xs"
            variant="success"
            onClick={handleExport}
            disabled={!!bulkRunning}
            icon={<Download size={13} />}>
            {t("friend_requests_export_button")} (
            {selectedIds.size > 0 ? selectedIds.size : friendRequests.length})
          </Button>

          {bulkTargets.length > 0 && !bulkRunning && (
            <>
              <Button
                size="xs"
                variant="success"
                onClick={() => handleBulkClick("accept")}
                icon={<Check size={13} />}>
                {t("friend_requests_bulk_accept_button", {
                  count: bulkTargets.length
                })}
              </Button>
              <Button
                size="xs"
                variant="outline"
                className="bm-border-danger/30 bm-bg-danger-soft bm-text-danger hover:bm-bg-danger-soft"
                onClick={() => handleBulkClick("delete")}
                icon={<X size={13} />}>
                {t("friend_requests_bulk_delete_button", {
                  count: bulkTargets.length
                })}
              </Button>
            </>
          )}
        </div>

        {/* Bulk Progress Indicator */}
        {bulkRunning && (
          <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2 bm-rounded-lg bm-border bm-border-line bm-bg-surface bm-px-2.5 bm-py-1.5 bm-text-[12px] bm-text-fg-muted">
            <Spinner size={13} />
            <span className="bm-font-medium">
              {bulkRunning.type === "accept"
                ? t("friend_requests_bulk_running_accept")
                : t("friend_requests_bulk_running_delete")}
            </span>
            <span className="bm-font-mono">
              {bulkRunning.current}/{bulkRunning.total}
            </span>
            <span className="bm-font-medium bm-text-success">
              ✓{bulkRunning.success}
            </span>
            {bulkRunning.fail > 0 && (
              <span className="bm-font-medium bm-text-danger">
                ✗{bulkRunning.fail}
              </span>
            )}
            <span className="bm-ml-auto">
              <IconButton
                tooltip={t("friend_requests_stop_tooltip")}
                size="xs"
                variant="danger"
                label={t("friend_requests_stop_tooltip")}
                onClick={stopBulk}>
                <Square size={12} />
              </IconButton>
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bm-overflow-x-auto bm-rounded-lg bm-border bm-border-line">
        <table className="bm-w-full bm-min-w-[560px] bm-border-collapse bm-text-[12px]">
          <thead className="bm-select-none bm-bg-surface-2">
            <tr className="bm-border-b bm-border-line">
              <th className={cn(th, "bm-w-8 bm-text-center")}>
                <Checkbox
                  size="sm"
                  checked={allPageSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className={cn(th, "bm-w-8 bm-text-center")}>#</th>
              <th className={cn(th, "bm-min-w-[150px]")}>
                {t("friend_requests_table_header_sender")}
              </th>
              <th className={cn(th, "bm-min-w-[120px]")}>
                {t("friend_requests_table_header_mutual_info")}
              </th>
              <th className={cn(th, "bm-w-28")}>
                {t("friend_requests_table_header_received_time")}
              </th>
              <th className={cn(th, "bm-w-24")}>
                {t("friend_requests_table_header_status")}
              </th>
              <th className={cn(th, "bm-w-20 bm-text-center")}>
                {t("friend_requests_table_header_action")}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && friendRequests.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="bm-p-6 bm-text-center bm-text-fg-muted">
                  <div className="bm-flex bm-items-center bm-justify-center bm-gap-2">
                    <Spinner size={14} />
                    {t("friend_requests_loading_scan")}
                  </div>
                </td>
              </tr>
            ) : paginatedRequests.length > 0 ? (
              paginatedRequests.map((req, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index + 1
                const isSelected = selectedIds.has(req.id)
                const processStatus = processedIds.get(req.id)
                const isProcessed = !!processStatus
                const processingType = processingIds.get(req.id)
                const isProcessing = !!processingType
                const actionDisabled =
                  isProcessed || isProcessing || !!bulkRunning

                return (
                  <tr
                    key={req.id}
                    className={cn(
                      "bm-border-b bm-border-line/60 bm-transition-colors last:bm-border-0 hover:bm-bg-surface-2/60",
                      isSelected &&
                        "bm-bg-brand-soft/50 hover:bm-bg-brand-soft/70"
                    )}>
                    <td className="bm-px-2 bm-py-2 bm-text-center">
                      <Checkbox
                        size="sm"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(req.id)}
                        disabled={isProcessed || isProcessing}
                      />
                    </td>
                    <td className="bm-px-2 bm-py-2 bm-text-center bm-font-mono bm-text-fg-subtle">
                      {globalIndex}
                    </td>
                    <td className="bm-px-2 bm-py-2">
                      <div className="bm-flex bm-items-center bm-gap-2">
                        <Avatar
                          src={req.profilePic}
                          name={req.name}
                          size={30}
                          rounded="xl"
                        />
                        <div className="bm-flex bm-min-w-0 bm-flex-col">
                          {req.url ? (
                            <a
                              href={req.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bm-truncate bm-text-[12.5px] bm-font-semibold bm-text-brand-ink hover:bm-underline">
                              {req.name}
                            </a>
                          ) : (
                            <span className="bm-truncate bm-text-[12.5px] bm-font-semibold">
                              {req.name}
                            </span>
                          )}
                          <span className="bm-font-mono bm-text-[10px] bm-text-fg-subtle">
                            {req.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td
                      className="bm-max-w-[180px] bm-truncate bm-px-2 bm-py-2 bm-text-fg-muted"
                      title={req.socialContext}>
                      {req.socialContext || (
                        <span className="bm-italic bm-text-fg-subtle">
                          {t("friend_requests_no_mutual_friends")}
                        </span>
                      )}
                    </td>
                    <td className="bm-px-2 bm-py-2 bm-font-mono bm-text-[11px] bm-text-fg-muted">
                      {formatTime(req.time)}
                    </td>
                    <td className="bm-px-2 bm-py-2">
                      <Badge
                        tone={
                          isProcessed
                            ? processStatus === "accepted"
                              ? "success"
                              : "neutral"
                            : "info"
                        }>
                        {isProcessed
                          ? processStatus === "accepted"
                            ? t("friend_requests_status_accepted")
                            : t("friend_requests_status_deleted")
                          : t("friend_requests_status_pending")}
                      </Badge>
                    </td>
                    <td className="bm-px-2 bm-py-2">
                      <div className="bm-flex bm-items-center bm-justify-center bm-gap-1">
                        <IconButton
                          tooltip={t("friend_requests_status_accepted")}
                          size="xs"
                          variant="outline"
                          label={t("friend_requests_accept_action")}
                          onClick={() =>
                            handleSingleAction(req.id, req.name, "accept")
                          }
                          disabled={actionDisabled}
                          className={cn(
                            !isProcessed &&
                              "bm-border-success/30 bm-bg-success-soft bm-text-success hover:bm-bg-success-soft"
                          )}>
                          {processingType === "accept" ? (
                            <Spinner size={12} />
                          ) : (
                            <Check size={13} />
                          )}
                        </IconButton>
                        <IconButton
                          tooltip={t("friend_requests_decline_request_tooltip")}
                          size="xs"
                          variant="outline"
                          label={t("friend_requests_decline_request_tooltip")}
                          onClick={() =>
                            handleSingleAction(req.id, req.name, "delete")
                          }
                          disabled={actionDisabled}
                          className={cn(
                            !isProcessed &&
                              "bm-border-danger/30 bm-bg-danger-soft bm-text-danger hover:bm-bg-danger-soft"
                          )}>
                          {processingType === "delete" ? (
                            <Spinner size={12} />
                          ) : (
                            <X size={13} />
                          )}
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="bm-p-6 bm-text-center bm-text-[12.5px] bm-italic bm-text-fg-muted">
                  {error
                    ? t("friend_requests_error_prefix", { error })
                    : t("friend_requests_empty_table")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TableFacebookPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredRequests.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Confirm single action */}
      <ConfirmDialog
        open={!!confirmActionUser}
        onOpenChange={(open) => !open && setConfirmActionUser(null)}
        destructive={confirmActionUser?.type === "delete"}
        title={
          confirmActionUser?.type === "accept"
            ? t("friend_requests_confirm_accept_title")
            : t("friend_requests_confirm_delete_title")
        }
        description={
          <>
            {confirmActionUser?.type === "accept"
              ? t("friend_requests_confirm_accept_desc_prefix")
              : t("friend_requests_confirm_delete_desc_prefix")}{" "}
            <strong className="bm-text-fg">{confirmActionUser?.name}</strong>?
          </>
        }
        cancelText={t("friend_requests_cancel_button")}
        confirmText={
          confirmActionUser?.type === "accept"
            ? t("friend_requests_accept_action")
            : t("friend_requests_delete_request_action")
        }
        onConfirm={handleConfirmSingleAction}
      />

      {/* Confirm bulk action */}
      <ConfirmDialog
        open={!!bulkConfirmType}
        onOpenChange={(open) => !open && setBulkConfirmType(null)}
        destructive={bulkConfirmType === "delete"}
        title={
          bulkConfirmType === "accept"
            ? t("friend_requests_confirm_bulk_accept_title")
            : t("friend_requests_confirm_bulk_delete_title")
        }
        description={
          <>
            {t("friend_requests_confirm_bulk_desc_prefix")}{" "}
            {bulkConfirmType === "accept"
              ? t("friend_requests_bulk_action_accept_label")
              : t("friend_requests_bulk_action_decline_label")}{" "}
            {t("friend_requests_confirm_bulk_desc_middle")}{" "}
            <strong className="bm-text-fg">{bulkTargets.length}</strong>{" "}
            {t("friend_requests_confirm_bulk_desc_suffix")}
            <br />
            <span className="bm-font-semibold bm-text-danger">
              {t("friend_requests_note_label")}
            </span>{" "}
            {t("friend_requests_confirm_bulk_note")}
          </>
        }
        cancelText={t("friend_requests_cancel_button")}
        confirmText={
          bulkConfirmType === "accept"
            ? t("friend_requests_proceed_accept_button")
            : t("friend_requests_proceed_delete_button")
        }
        onConfirm={handleConfirmBulkAction}
      />
    </div>
  )
}
