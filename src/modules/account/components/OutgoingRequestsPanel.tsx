import {
  Download,
  ExternalLink,
  History,
  Loader2,
  RotateCw,
  Search,
  Square,
  TrendingUp,
  UserX
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { normalizeForSearch } from "src/configs/tools.config"
import { useOutgoingRequests } from "src/modules/account/hooks/useOutgoingRequests"
import { TableFacebookPagination } from "src/modules/facebook/components/TablePagination"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import type { BulkState } from "src/modules/facebook/types/bulk.types"
import { runFacebookBulkAction } from "src/modules/facebook/utils/bulk-action.util"
import {
  Badge,
  Button,
  Checkbox,
  cn,
  ConfirmDialog,
  IconButton,
  Input
} from "src/modules/shared/ui"
import { exportToCSV } from "src/utils/export.util"

type OutgoingBulkState = BulkState<"cancel_request">

export function OutgoingRequestsPanel() {
  const { t } = useTranslation()
  const { profile } = useFacebook()
  const {
    error,
    outgoingRequests,
    outgoingRequestsState,
    outgoingRequestsTotalCount,
    loadOutgoingRequests,
    cancelOutgoingRequest
  } = useOutgoingRequests()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set())
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set())
  const [confirmCancelUser, setConfirmCancelUser] = useState<{
    id: string
    name: string
  } | null>(null)
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)

  // Bulk state
  const bulkStopRef = useRef<boolean>(false)
  const [bulkRunning, setBulkRunning] = useState<OutgoingBulkState | null>(null)

  useEffect(() => {
    if (profile?.uid) {
      loadOutgoingRequests({ cursor: null, accumulate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid])

  const handleReload = () => {
    setSelectedIds(new Set())
    setCancelledIds(new Set())
    loadOutgoingRequests({
      cursor: null,
      accumulate: false,
      forceRefresh: true
    })
  }

  // Search and filter
  const filteredRequests = useMemo(() => {
    const query = normalizeForSearch(searchQuery)
    return outgoingRequests.filter(
      (req) =>
        normalizeForSearch(req.name).includes(query) ||
        req.id.includes(query) ||
        normalizeForSearch(req.socialContext).includes(query)
    )
  }, [outgoingRequests, searchQuery])

  // Pagination
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredRequests.slice(startIndex, startIndex + pageSize)
  }, [filteredRequests, currentPage, pageSize])

  const totalPages = Math.ceil(filteredRequests.length / pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  // Selection
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedRequests.length) {
      setSelectedIds(new Set())
    } else {
      const newSelection = new Set<string>()
      paginatedRequests.forEach((r) => {
        if (!cancelledIds.has(r.id)) {
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

  const handleCancelOne = (id: string, name: string) => {
    setConfirmCancelUser({ id, name })
  }

  const handleConfirmCancelOne = async () => {
    if (!confirmCancelUser) return
    const { id, name } = confirmCancelUser
    setConfirmCancelUser(null)
    setCancellingIds((prev) => new Set(prev).add(id))
    const success = await cancelOutgoingRequest(id)
    setCancellingIds((prev) => {
      const s = new Set(prev)
      s.delete(id)
      return s
    })
    if (success) {
      setCancelledIds((prev) => new Set(prev).add(id))
      setSelectedIds((prev) => {
        const s = new Set(prev)
        s.delete(id)
        return s
      })
      toast.success(t("outgoing_requests_toast_cancel_success", { name }))
    } else {
      toast.error(t("outgoing_requests_toast_cancel_failed", { name }))
    }
  }

  const bulkCancelTargets = useMemo(
    () => Array.from(selectedIds).filter((id) => !cancelledIds.has(id)),
    [selectedIds, cancelledIds]
  )

  const handleBulkCancelClick = () => {
    if (bulkCancelTargets.length === 0) return
    setShowBulkConfirm(true)
  }

  const handleConfirmBulkCancel = async () => {
    setShowBulkConfirm(false)
    const targets = bulkCancelTargets
    if (targets.length === 0) return

    await runFacebookBulkAction({
      targets,
      actionType: "cancel_request",
      bulkStopRef,
      setBulkRunning,
      executeSingle: async (id) => {
        setCancellingIds((prev) => new Set(prev).add(id))
        const ok = await cancelOutgoingRequest(id)
        setCancellingIds((prev) => {
          const s = new Set(prev)
          s.delete(id)
          return s
        })
        if (ok) {
          setCancelledIds((prev) => new Set(prev).add(id))
          setSelectedIds((prev) => {
            const s = new Set(prev)
            s.delete(id)
            return s
          })
          return true
        }
        return false
      },
      onFinished: (success, fail) => {
        toast.success(
          t("outgoing_requests_toast_bulk_cancel_result", { success, fail })
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
        ? outgoingRequests.filter((r) => selectedIds.has(r.id))
        : outgoingRequests

    if (listToExport.length === 0) {
      toast.error(t("outgoing_requests_toast_export_empty"))
      return
    }

    const headers = [
      t("outgoing_requests_csv_header_index"),
      t("outgoing_requests_csv_header_uid"),
      t("outgoing_requests_csv_header_name"),
      t("outgoing_requests_csv_header_context"),
      t("outgoing_requests_csv_header_url"),
      t("outgoing_requests_csv_header_status")
    ]
    const csvRows = listToExport.map((r, idx) => [
      idx + 1,
      r.id,
      r.name,
      r.socialContext,
      r.url,
      cancelledIds.has(r.id)
        ? t("outgoing_requests_status_cancelled")
        : t("outgoing_requests_status_pending")
    ])

    exportToCSV(headers, csvRows, `yeu_cau_ket_ban_da_gui_${Date.now()}.csv`)
    toast.success(
      t("outgoing_requests_toast_export_success", {
        count: listToExport.length
      })
    )
  }

  const isLoading = outgoingRequestsState === "loading"
  const selectableOnPage = paginatedRequests.filter(
    (r) => !cancelledIds.has(r.id)
  ).length

  return (
    <div className="bm-flex bm-w-full bm-flex-col bm-gap-3 bm-text-fg">
      {/* Header */}
      <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
        <Badge tone="success">
          {t("outgoing_requests_loaded_count", {
            loaded: outgoingRequests.length,
            total:
              outgoingRequestsTotalCount > 0
                ? `/${outgoingRequestsTotalCount}`
                : ""
          })}
        </Badge>
        {isLoading && outgoingRequests.length > 0 && (
          <Loader2 size={13} className="bm-animate-spin bm-text-brand-ink" />
        )}
      </div>

      {/* Toolbar */}
      <div className="bm-flex bm-flex-col bm-gap-2 bm-rounded-lg bm-border bm-border-line bm-bg-surface-2/50 bm-p-2.5">
        <Input
          size="sm"
          type="text"
          placeholder={t("outgoing_requests_search_placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          suffix={<Search size={14} className="bm-mx-2 bm-text-fg-subtle" />}
        />

        <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
          <Button
            size="xs"
            variant="primary"
            onClick={handleReload}
            disabled={isLoading || !!bulkRunning}
            icon={
              <RotateCw
                size={13}
                className={isLoading ? "bm-animate-spin" : ""}
              />
            }>
            {t("outgoing_requests_reload_button")}
          </Button>

          <Button
            size="xs"
            variant="success"
            onClick={handleExport}
            disabled={!!bulkRunning}
            icon={<Download size={13} />}>
            {t("outgoing_requests_export_button")} (
            {selectedIds.size > 0 ? selectedIds.size : outgoingRequests.length})
          </Button>

          {bulkCancelTargets.length > 0 && !bulkRunning && (
            <Button
              size="xs"
              variant="danger"
              onClick={handleBulkCancelClick}
              icon={<UserX size={13} />}>
              {t("outgoing_requests_bulk_cancel_button", {
                count: bulkCancelTargets.length
              })}
            </Button>
          )}

          <div className="bm-ml-auto bm-flex bm-items-center bm-overflow-hidden bm-rounded-lg bm-border bm-border-line bm-bg-surface">
            <IconButton
              size="xs"
              className="bm-rounded-none"
              label={t("outgoing_requests_reload_tooltip")}
              onClick={handleReload}
              disabled={isLoading || !!bulkRunning}>
              <History size={13} />
            </IconButton>
            <IconButton
              size="xs"
              className="bm-rounded-none bm-border-l bm-border-line"
              label={t("outgoing_requests_analytics_tooltip")}
              onClick={() =>
                toast(t("outgoing_requests_toast_feature_developing"))
              }>
              <TrendingUp size={13} />
            </IconButton>
            <IconButton
              size="xs"
              className="bm-rounded-none bm-border-l bm-border-line"
              label={t("outgoing_requests_open_facebook_friends_tooltip")}
              onClick={() =>
                window.open("https://facebook.com/friends", "_blank")
              }>
              <ExternalLink size={13} />
            </IconButton>
          </div>
        </div>

        {/* Bulk Progress Indicator */}
        {bulkRunning && (
          <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2 bm-rounded-lg bm-border bm-border-line bm-bg-surface bm-px-2.5 bm-py-1 bm-text-[12px] bm-text-fg-muted">
            <Loader2
              size={13}
              className="bm-shrink-0 bm-animate-spin bm-text-brand-ink"
            />
            <span className="bm-font-medium">
              {t("outgoing_requests_bulk_running_cancel")}
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
            <IconButton
              size="xs"
              variant="ghost"
              className="bm-ml-auto hover:bm-bg-danger-soft hover:bm-text-danger"
              label={t("outgoing_requests_stop_tooltip")}
              onClick={stopBulk}>
              <Square size={12} />
            </IconButton>
          </div>
        )}
      </div>

      {/* Table Area */}
      <div className="bm-overflow-x-auto bm-rounded-lg bm-border bm-border-line bm-bg-surface">
        <table className="bm-w-full bm-border-collapse bm-text-[12.5px]">
          <thead className="bm-select-none bm-bg-surface-2/60">
            <tr className="bm-border-b bm-border-line bm-text-left bm-text-[11px] bm-font-semibold bm-text-fg-muted">
              <th className="bm-w-9 bm-px-2 bm-py-2 bm-text-center">
                <Checkbox
                  size="sm"
                  checked={
                    paginatedRequests.length > 0 &&
                    selectedIds.size === selectableOnPage
                  }
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="bm-w-8 bm-px-1 bm-py-2 bm-text-center bm-text-[10px] bm-uppercase bm-tracking-wider">
                #
              </th>
              <th className="bm-px-2 bm-py-2">
                {t("outgoing_requests_table_header_recipient")}
              </th>
              <th className="bm-px-2 bm-py-2">
                {t("outgoing_requests_table_header_status")}
              </th>
              <th className="bm-w-12 bm-px-2 bm-py-2 bm-text-center">
                {t("outgoing_requests_table_header_action")}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && outgoingRequests.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="bm-p-8 bm-text-center bm-text-fg-muted">
                  <div className="bm-flex bm-items-center bm-justify-center bm-gap-2">
                    <Loader2
                      size={15}
                      className="bm-animate-spin bm-text-brand-ink"
                    />
                    {t("outgoing_requests_loading_scan")}
                  </div>
                </td>
              </tr>
            ) : paginatedRequests.length > 0 ? (
              paginatedRequests.map((req, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index + 1
                const isSelected = selectedIds.has(req.id)
                const isCancelled = cancelledIds.has(req.id)
                const isCancelling = cancellingIds.has(req.id)

                return (
                  <tr
                    key={req.id}
                    className={cn(
                      "bm-border-b bm-border-line/60 bm-transition-colors last:bm-border-b-0 hover:bm-bg-surface-2/60",
                      isSelected && "bm-bg-brand-soft/60 hover:bm-bg-brand-soft"
                    )}>
                    <td className="bm-px-2 bm-py-2 bm-text-center bm-align-middle">
                      <Checkbox
                        size="sm"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(req.id)}
                        disabled={isCancelled || isCancelling}
                      />
                    </td>
                    <td className="bm-px-1 bm-py-2 bm-text-center bm-font-mono bm-text-[11px] bm-text-fg-subtle">
                      {globalIndex}
                    </td>
                    <td className="bm-max-w-0 bm-px-2 bm-py-2">
                      <div className="bm-flex bm-items-center bm-gap-2.5">
                        <img
                          src={req.profilePic}
                          alt={req.name}
                          className="bm-h-9 bm-w-9 bm-shrink-0 bm-rounded-lg bm-border bm-border-line bm-bg-surface-2 bm-object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src =
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(req.name)}`
                          }}
                        />
                        <div className="bm-flex bm-min-w-0 bm-flex-col">
                          {req.url ? (
                            <a
                              href={req.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bm-truncate bm-text-[13px] bm-font-semibold bm-text-brand-ink hover:bm-underline">
                              {req.name}
                            </a>
                          ) : (
                            <span className="bm-truncate bm-text-[13px] bm-font-semibold">
                              {req.name}
                            </span>
                          )}
                          <span className="bm-font-mono bm-text-[10px] bm-tracking-tight bm-text-fg-subtle">
                            {req.id}
                          </span>
                          <span
                            className="bm-truncate bm-text-[11.5px] bm-text-fg-muted"
                            title={req.socialContext}>
                            {req.socialContext || (
                              <span className="bm-italic bm-text-fg-subtle">
                                {t("outgoing_requests_no_info")}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="bm-px-2 bm-py-2">
                      <Badge tone={isCancelled ? "neutral" : "info"} size="xs">
                        {isCancelled
                          ? t("outgoing_requests_status_cancelled")
                          : t("outgoing_requests_status_pending")}
                      </Badge>
                    </td>
                    <td className="bm-px-2 bm-py-2 bm-text-center">
                      <IconButton
                        tooltip={
                          isCancelled
                            ? t("outgoing_requests_cancelled_label")
                            : t("outgoing_requests_cancel_request_tooltip")
                        }
                        tooltipPlacement="top-end"
                        size="xs"
                        variant="outline"
                        label={
                          isCancelled
                            ? t("outgoing_requests_cancelled_label")
                            : t("outgoing_requests_cancel_request_tooltip")
                        }
                        onClick={() => handleCancelOne(req.id, req.name)}
                        disabled={isCancelled || isCancelling || !!bulkRunning}
                        className={cn(
                          isCancelled
                            ? "bm-cursor-default bm-text-fg-subtle"
                            : "bm-border-danger/30 bm-bg-danger-soft bm-text-danger hover:bm-bg-danger-soft hover:bm-brightness-95"
                        )}>
                        {isCancelling ? (
                          <Loader2 size={13} className="bm-animate-spin" />
                        ) : (
                          <UserX size={13} />
                        )}
                      </IconButton>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="bm-p-8 bm-text-center bm-text-[12.5px] bm-italic bm-text-fg-muted">
                  {error
                    ? t("outgoing_requests_error_prefix", { error })
                    : t("outgoing_requests_empty_table")}
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

      {/* Confirm Cancel One Dialog */}
      <ConfirmDialog
        open={!!confirmCancelUser}
        onOpenChange={(open) => !open && setConfirmCancelUser(null)}
        title={t("outgoing_requests_confirm_cancel_title")}
        description={
          <>
            {t("outgoing_requests_confirm_cancel_desc_prefix")}{" "}
            <strong className="bm-text-fg">{confirmCancelUser?.name}</strong>?{" "}
            {t("outgoing_requests_confirm_cancel_desc_suffix")}
          </>
        }
        cancelText={t("outgoing_requests_cancel_button")}
        confirmText={t("outgoing_requests_confirm_cancel_action")}
        destructive
        onConfirm={handleConfirmCancelOne}
      />

      {/* Confirm Bulk Cancel Dialog */}
      <ConfirmDialog
        open={showBulkConfirm}
        onOpenChange={setShowBulkConfirm}
        title={t("outgoing_requests_confirm_bulk_cancel_title")}
        description={
          <>
            {t("outgoing_requests_confirm_bulk_cancel_desc_prefix")}{" "}
            <strong className="bm-text-fg">{bulkCancelTargets.length}</strong>{" "}
            {t("outgoing_requests_confirm_bulk_cancel_desc_suffix")}
            <br />
            <span className="bm-font-semibold bm-text-danger">
              {t("outgoing_requests_note_label")}
            </span>{" "}
            {t("outgoing_requests_confirm_bulk_cancel_note")}
          </>
        }
        cancelText={t("outgoing_requests_cancel_button")}
        confirmText={t("outgoing_requests_proceed_cancel_button")}
        destructive
        onConfirm={handleConfirmBulkCancel}
      />
    </div>
  )
}
