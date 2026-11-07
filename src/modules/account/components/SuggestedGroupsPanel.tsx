import { exportToCSV } from "src/utils/export.util"
import { normalizeForSearch } from "src/configs/tools.config"
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  RotateCw,
  Search,
  ShieldAlert,
  Square,
  UserPlus
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { TableFacebookPagination } from "src/modules/facebook/components/TablePagination"
import { BulkState, runFacebookBulkAction } from "src/modules/facebook/utils/bulk-action.util"
import { useTranslation } from "react-i18next"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import { Badge, Button, Callout, Checkbox, cn, ConfirmDialog, IconButton, Input } from "src/modules/shared/ui"

import { useSuggestedGroups } from "src/modules/account/hooks/useSuggestedGroups"
import { SuggestedGroup } from "src/modules/account/types/groups.types"

type GroupsBulkState = BulkState<"join">

export function SuggestedGroupsPanel() {
  const { t } = useTranslation()
  const { profile } = useFacebook()
  const { state, suggestedGroups: apiGroups, load, joinGroup } = useSuggestedGroups()
  const [localGroups, setLocalGroups] = useState<SuggestedGroup[]>([])

  // UI state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Track locally joined or joining groups to manage UI states immediately
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set())
  const [joiningGroupIds, setJoiningGroupIds] = useState<Set<string>>(new Set())
  const [failedGroupIds, setFailedGroupIds] = useState<Set<string>>(new Set())

  // Bulk state
  const bulkStopRef = useRef(false)
  const [bulkRunning, setBulkRunning] = useState<GroupsBulkState | null>(null)

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string } | null>(null)
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false)

  useEffect(() => {
    if (profile?.uid) {
      load({ cursor: null, accumulate: false, forceRefresh: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid])

  // Update local list when API loads data
  useEffect(() => {
    if (apiGroups) {
      setLocalGroups(apiGroups)
    }
  }, [apiGroups])

  const handleReload = () => {
    load({ cursor: null, accumulate: false, forceRefresh: true })
    setJoinedGroupIds(new Set())
    setFailedGroupIds(new Set())
    setSelectedIds(new Set())
  }

  // Filtered list
  const filteredGroups = useMemo(() => {
    const query = normalizeForSearch(searchQuery)
    return localGroups.filter((group) => {
      return normalizeForSearch(group.name).includes(query) || group.uid.includes(query)
    })
  }, [localGroups, searchQuery])

  // Pagination
  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredGroups.slice(startIndex, startIndex + pageSize)
  }, [filteredGroups, currentPage, pageSize])

  const totalPages = Math.ceil(filteredGroups.length / pageSize)

  // Reset page when query/size changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  // Selection handlers
  const toggleSelectAll = () => {
    const joinableInPage = paginatedGroups.filter((g) => !joinedGroupIds.has(g.id))
    const allSelected = joinableInPage.length > 0 && joinableInPage.every((g) => selectedIds.has(g.id))

    const newSelection = new Set(selectedIds)
    if (allSelected) {
      joinableInPage.forEach((g) => newSelection.delete(g.id))
    } else {
      joinableInPage.forEach((g) => newSelection.add(g.id))
    }
    setSelectedIds(newSelection)
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

  const handleJoinOneClick = (id: string, name: string) => {
    setConfirmTarget({ id, name })
    setIsConfirmOpen(true)
  }

  const handleJoinOneConfirm = async () => {
    if (!confirmTarget) return
    const { id, name } = confirmTarget
    setJoiningGroupIds((prev) => new Set(prev).add(id))
    setFailedGroupIds((prev) => {
      const s = new Set(prev)
      s.delete(id)
      return s
    })

    const success = await joinGroup(id)

    setJoiningGroupIds((prev) => {
      const s = new Set(prev)
      s.delete(id)
      return s
    })
    if (success) {
      setJoinedGroupIds((prev) => new Set(prev).add(id))
      toast.success(t("suggested_groups_toast_join_success", { name }))
    } else {
      setFailedGroupIds((prev) => new Set(prev).add(id))
      toast.error(t("suggested_groups_toast_join_fail", { name }))
    }
  }

  // Bulk actions
  const bulkJoinTargets = useMemo(
    () => Array.from(selectedIds).filter((id) => !joinedGroupIds.has(id)),
    [selectedIds, joinedGroupIds]
  )

  const handleBulkJoinClick = () => {
    if (bulkJoinTargets.length === 0) return
    setIsBulkConfirmOpen(true)
  }

  const handleBulkJoinConfirm = async () => {
    const targets = bulkJoinTargets
    if (targets.length === 0) return

    await runFacebookBulkAction({
      targets,
      actionType: "join",
      bulkStopRef,
      setBulkRunning,
      executeSingle: async (id) => {
        setJoiningGroupIds((prev) => new Set(prev).add(id))
        setFailedGroupIds((prev) => {
          const s = new Set(prev)
          s.delete(id)
          return s
        })

        const ok = await joinGroup(id)

        setJoiningGroupIds((prev) => {
          const s = new Set(prev)
          s.delete(id)
          return s
        })
        if (ok) {
          setJoinedGroupIds((prev) => new Set(prev).add(id))
          return true
        }
        setFailedGroupIds((prev) => new Set(prev).add(id))
        return false
      },
      onFinished: (success, fail) => {
        toast.success(t("suggested_groups_toast_bulk_finished", { success, fail }))
      }
    })
  }

  const stopBulk = () => {
    bulkStopRef.current = true
  }

  // CSV Export
  const handleExport = () => {
    const listToExport =
      selectedIds.size > 0 ? localGroups.filter((g) => selectedIds.has(g.id)) : localGroups

    if (listToExport.length === 0) {
      toast.error(t("suggested_groups_toast_export_no_data"))
      return
    }

    const headers = [
      t("suggested_groups_csv_header_no"),
      t("suggested_groups_csv_header_group_id"),
      t("suggested_groups_csv_header_name"),
      t("suggested_groups_csv_header_snippet"),
      t("suggested_groups_csv_header_status")
    ]
    const csvRows = listToExport.map((g, idx) => [
      idx + 1,
      g.uid,
      g.name,
      g.snippet,
      joinedGroupIds.has(g.id)
        ? t("suggested_groups_csv_status_requested")
        : failedGroupIds.has(g.id)
          ? t("suggested_groups_csv_status_failed")
          : t("suggested_groups_csv_status_not_joined")
    ])

    exportToCSV(headers, csvRows, `nhom_de_xuat_${Date.now()}.csv`)
    toast.success(t("suggested_groups_toast_export_success", { count: listToExport.length }))
  }

  const th = "bm-px-2 bm-py-2 bm-text-left bm-text-[11px] bm-font-semibold bm-text-fg-muted"
  const joinableInPage = paginatedGroups.filter((g) => !joinedGroupIds.has(g.id))

  return (
    <div className="bm-flex bm-w-full bm-flex-col bm-gap-3 bm-rounded-xl bm-border bm-border-line bm-bg-surface bm-p-3 bm-text-fg">
      {/* Header */}
      <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
        <h2 className="bm-text-[14px] bm-font-semibold">{t("suggested_groups_panel_title")}</h2>
        <Badge tone="brand">
          {t("suggested_groups_loaded_count", { count: localGroups.length })}
        </Badge>
      </div>

      {/* Shield Warning */}
      <Callout tone="warning" compact icon={<ShieldAlert size={15} />}>
        <span className="bm-text-[12px]">{t("suggested_groups_warning_text")}</span>
      </Callout>

      {/* Toolbar */}
      <div className="bm-flex bm-flex-col bm-gap-2 bm-rounded-lg bm-border bm-border-line bm-bg-surface-2/50 bm-p-2.5">
        <Input
          size="sm"
          type="text"
          placeholder={t("suggested_groups_search_placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          suffix={<Search size={14} />}
        />

        <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={handleReload}
            disabled={state === "loading" || !!bulkRunning}
            icon={<RotateCw size={13} className={cn(state === "loading" && "bm-animate-spin")} />}>
            {t("suggested_groups_button_reload")}
          </Button>

          <Button
            size="sm"
            variant="success"
            onClick={handleExport}
            disabled={!!bulkRunning}
            icon={<Download size={13} />}>
            {t("suggested_groups_button_export")}{" "}
            <span className="bm-text-[11px]">
              ({selectedIds.size > 0 ? selectedIds.size : localGroups.length})
            </span>
          </Button>

          {bulkJoinTargets.length > 0 && !bulkRunning && (
            <Button
              size="sm"
              variant="success"
              onClick={handleBulkJoinClick}
              icon={<UserPlus size={13} />}>
              {t("suggested_groups_button_bulk_join", { count: bulkJoinTargets.length })}
            </Button>
          )}

          <div className="bm-ml-auto bm-flex bm-items-center bm-gap-1">
            <IconButton
              size="sm"
              variant="outline"
              label={t("suggested_groups_tooltip_discover_groups")}
              onClick={() => window.open("https://facebook.com/groups/discover/", "_blank")}>
              <ExternalLink size={14} />
            </IconButton>
          </div>
        </div>

        {/* Bulk process progress */}
        {bulkRunning && (
          <div className="bm-flex bm-items-center bm-gap-2 bm-rounded-lg bm-border bm-border-line bm-bg-surface bm-px-2.5 bm-py-1 bm-text-[12px] bm-text-fg-muted">
            <Loader2 size={14} className="bm-shrink-0 bm-animate-spin bm-text-brand-ink" />
            <span className="bm-font-medium">{t("suggested_groups_bulk_progress_joining")}</span>
            <span className="bm-font-mono">
              {bulkRunning.current}/{bulkRunning.total}
            </span>
            <span className="bm-font-medium bm-text-success">✓{bulkRunning.success}</span>
            {bulkRunning.fail > 0 && (
              <span className="bm-font-medium bm-text-danger">✗{bulkRunning.fail}</span>
            )}
            <IconButton
              size="xs"
              variant="ghost"
              className="bm-ml-auto hover:bm-bg-danger-soft hover:bm-text-danger"
              label={t("suggested_groups_button_stop")}
              onClick={stopBulk}>
              <Square size={12} />
            </IconButton>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bm-overflow-x-auto bm-rounded-lg bm-border bm-border-line">
        <table className="bm-w-full bm-border-collapse bm-text-[12.5px]">
          <thead className="bm-select-none bm-bg-surface-2">
            <tr className="bm-border-b bm-border-line">
              <th className="bm-w-8 bm-px-2 bm-py-2 bm-text-center">
                <Checkbox
                  size="sm"
                  checked={
                    paginatedGroups.length > 0 && joinableInPage.every((g) => selectedIds.has(g.id))
                  }
                  onChange={toggleSelectAll}
                />
              </th>
              <th className={cn(th, "bm-w-8 bm-text-center")}>#</th>
              <th className={cn(th, "bm-min-w-[180px]")}>
                <div className="bm-flex bm-items-center bm-gap-1">
                  {t("suggested_groups_col_group")}
                  <ArrowUpDown size={11} className="bm-text-fg-subtle" />
                </div>
              </th>
              <th className={cn(th, "bm-min-w-[120px]")}>{t("suggested_groups_col_group_info")}</th>
              <th className={th}>{t("suggested_groups_col_status")}</th>
              <th className={cn(th, "bm-text-center")}>{t("suggested_groups_col_action")}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedGroups.length > 0 ? (
              paginatedGroups.map((group, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index + 1
                const isSelected = selectedIds.has(group.id)
                const isJoined = joinedGroupIds.has(group.id)
                const isFailed = failedGroupIds.has(group.id)
                const isJoining = joiningGroupIds.has(group.id)

                return (
                  <tr
                    key={group.id}
                    className={cn(
                      "bm-border-b bm-border-line last:bm-border-b-0 bm-transition-colors hover:bm-bg-surface-2/60",
                      isSelected && "bm-bg-brand-soft/60 hover:bm-bg-brand-soft"
                    )}>
                    <td className="bm-px-2 bm-py-2 bm-text-center">
                      <Checkbox
                        size="sm"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(group.id)}
                        disabled={isJoined || isJoining}
                      />
                    </td>
                    <td className="bm-px-2 bm-py-2 bm-text-center bm-font-mono bm-text-[11px] bm-text-fg-subtle">
                      {globalIndex}
                    </td>
                    <td className="bm-px-2 bm-py-2">
                      <div className="bm-flex bm-items-center bm-gap-2">
                        <img
                          src={group.avatar}
                          alt={group.name}
                          className="bm-h-9 bm-w-14 bm-shrink-0 bm-rounded-md bm-border bm-border-line bm-bg-surface-2 bm-object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src =
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(group.name)}`
                          }}
                        />
                        <div className="bm-flex bm-min-w-0 bm-flex-col">
                          <a
                            href={group.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bm-truncate bm-font-semibold bm-text-brand-ink hover:bm-underline">
                            {group.name}
                          </a>
                          <span className="bm-mt-0.5 bm-font-mono bm-text-[10px] bm-tracking-tight bm-text-fg-subtle">
                            {group.uid}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="bm-px-2 bm-py-2 bm-text-[12px] bm-font-medium bm-text-fg-muted">
                      {group.snippet || t("suggested_groups_snippet_fallback")}
                    </td>
                    <td className="bm-px-2 bm-py-2">
                      <Badge
                        size="xs"
                        tone={isJoined ? "success" : isFailed ? "danger" : isJoining ? "brand" : "neutral"}>
                        {isJoined
                          ? t("suggested_groups_status_requested")
                          : isFailed
                            ? t("suggested_groups_status_failed")
                            : isJoining
                              ? t("suggested_groups_status_joining")
                              : t("suggested_groups_status_not_joined")}
                      </Badge>
                    </td>
                    <td className="bm-px-2 bm-py-2 bm-text-center">
                      <IconButton
                        size="xs"
                        variant="outline"
                        onClick={() => handleJoinOneClick(group.id, group.name)}
                        disabled={isJoined || isJoining}
                        className={cn(
                          isJoined
                            ? "bm-cursor-default bm-border-success/30 bm-bg-success-soft bm-text-success"
                            : "bm-border-brand/30 bm-bg-brand-soft bm-text-brand-ink hover:bm-bg-brand-soft hover:bm-brightness-95"
                        )}
                        label={
                          isJoined
                            ? t("suggested_groups_action_join_tooltip_joined")
                            : t("suggested_groups_action_join_tooltip")
                        }>
                        {isJoining ? (
                          <Loader2 size={13} className="bm-animate-spin" />
                        ) : isJoined ? (
                          <CheckCircle2 size={13} />
                        ) : isFailed ? (
                          <AlertCircle size={13} className="bm-text-danger" />
                        ) : (
                          <UserPlus size={13} />
                        )}
                      </IconButton>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="bm-p-8 bm-text-center bm-text-[12.5px] bm-italic bm-text-fg-muted">
                  {state === "loading" ? (
                    <span className="bm-flex bm-items-center bm-justify-center bm-gap-2">
                      <Loader2 size={15} className="bm-animate-spin bm-text-brand-ink" />
                      {t("suggested_groups_loading_groups")}
                    </span>
                  ) : (
                    t("suggested_groups_no_matching_groups")
                  )}
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
        totalItems={filteredGroups.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleJoinOneConfirm}
        title={t("suggested_groups_confirm_join_title")}
        description={
          confirmTarget
            ? t("suggested_groups_confirm_join_description", { name: confirmTarget.name })
            : ""
        }
        confirmText={t("suggested_groups_confirm_join_button")}
      />

      <ConfirmDialog
        open={isBulkConfirmOpen}
        onOpenChange={setIsBulkConfirmOpen}
        onConfirm={handleBulkJoinConfirm}
        title={t("suggested_groups_confirm_bulk_join_title")}
        description={t("suggested_groups_confirm_bulk_join_description", {
          count: bulkJoinTargets.length
        })}
        confirmText={t("suggested_groups_confirm_bulk_join_button")}
      />
    </div>
  )
}
