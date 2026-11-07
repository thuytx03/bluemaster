import { exportToCSV } from "src/utils/export.util"
import { normalizeForSearch } from "src/configs/tools.config"
import {
  ArrowUpDown,
  CheckCircle2,
  Download,
  ExternalLink,
  Filter,
  History,
  Loader2,
  RotateCw,
  Search,
  Square,
  ThumbsDown
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { TableFacebookPagination } from "src/modules/facebook/components/TablePagination"
import { BulkState, runFacebookBulkAction } from "src/modules/facebook/utils/bulk-action.util"
import { useTranslation } from "react-i18next"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import { Badge, Button, Checkbox, cn, IconButton, Input } from "src/modules/shared/ui"

import { useLikedPages } from "src/modules/account/hooks/useLikedPages"
import type { LikedPage } from "src/modules/account/types/liked-pages.types"

type LikedPagesBulkState = BulkState<"unlike">

export function LikedPagesPanel() {
  const { t } = useTranslation()
  const { profile } = useFacebook()
  const { state, likedPages: apiPages, load, unlikePage } = useLikedPages()
  const [localPages, setLocalPages] = useState<LikedPage[]>([])
  const [unlikedIds, setUnlikedIds] = useState<Set<string>>(new Set())
  const [unlikingIds, setUnlikingIds] = useState<Set<string>>(new Set())

  // UI state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Bulk state
  const bulkStopRef = useRef(false)
  const [bulkRunning, setBulkRunning] = useState<LikedPagesBulkState | null>(null)

  useEffect(() => {
    if (profile?.uid) {
      load({ cursor: null, accumulate: false, forceRefresh: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid])

  // Update local list when API loads data
  useEffect(() => {
    if (apiPages && apiPages.length > 0) {
      setLocalPages(apiPages)
    }
  }, [apiPages])

  const handleReload = () => {
    load({ cursor: null, accumulate: false, forceRefresh: true })
  }

  // Filtered list
  const filteredPages = useMemo(() => {
    const query = normalizeForSearch(searchQuery)
    return localPages.filter(
      (page) =>
        normalizeForSearch(page.name).includes(query) ||
        page.uid.includes(query) ||
        normalizeForSearch(page.category).includes(query)
    )
  }, [localPages, searchQuery])

  // Pagination
  const paginatedPages = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredPages.slice(startIndex, startIndex + pageSize)
  }, [filteredPages, currentPage, pageSize])

  const totalPages = Math.ceil(filteredPages.length / pageSize)

  // Reset page when query/size changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedPages.length) {
      setSelectedIds(new Set())
    } else {
      const newSelection = new Set<string>()
      paginatedPages.forEach((p) => newSelection.add(p.id))
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

  const handleUnlikeOne = async (id: string, name: string) => {
    setUnlikingIds((prev) => new Set(prev).add(id))
    const success = await unlikePage(id)
    setUnlikingIds((prev) => {
      const s = new Set(prev)
      s.delete(id)
      return s
    })
    if (success) {
      setUnlikedIds((prev) => new Set(prev).add(id))
      toast.success(t("liked_pages_toast_unlike_success", { name }))
    } else {
      toast.error(t("liked_pages_toast_unlike_failed", { name }))
    }
  }

  // Bulk actions
  const bulkUnlikeTargets = useMemo(
    () => Array.from(selectedIds).filter((id) => !unlikedIds.has(id)),
    [selectedIds, unlikedIds]
  )

  const handleBulkUnlike = async () => {
    const targets = bulkUnlikeTargets
    if (targets.length === 0) return

    await runFacebookBulkAction({
      targets,
      actionType: "unlike",
      bulkStopRef,
      setBulkRunning,
      executeSingle: async (id) => {
        setUnlikingIds((prev) => new Set(prev).add(id))
        const ok = await unlikePage(id)
        setUnlikingIds((prev) => {
          const s = new Set(prev)
          s.delete(id)
          return s
        })
        if (ok) {
          setUnlikedIds((prev) => new Set(prev).add(id))
          return true
        }
        return false
      },
      onFinished: (success, fail) => {
        toast.success(t("liked_pages_toast_bulk_unlike_result", { success, fail }))
      }
    })
  }

  const stopBulk = () => {
    bulkStopRef.current = true
  }

  // CSV Export
  const handleExport = () => {
    const listToExport =
      selectedIds.size > 0 ? localPages.filter((p) => selectedIds.has(p.id)) : localPages

    if (listToExport.length === 0) {
      toast.error(t("liked_pages_toast_export_empty"))
      return
    }

    const headers = [
      t("liked_pages_csv_header_index"),
      t("liked_pages_csv_header_uid"),
      t("liked_pages_csv_header_name"),
      t("liked_pages_csv_header_category"),
      t("liked_pages_csv_header_status")
    ]
    const csvRows = listToExport.map((p, idx) => [
      idx + 1,
      p.uid,
      p.name,
      p.category,
      unlikedIds.has(p.id) ? t("liked_pages_status_unliked") : p.status
    ])

    exportToCSV(headers, csvRows, `danh_sach_trang_da_thich_${Date.now()}.csv`)
    toast.success(t("liked_pages_toast_export_success", { count: listToExport.length }))
  }

  const th = "bm-px-2 bm-py-2 bm-text-left bm-text-[11px] bm-font-semibold bm-text-fg-muted"

  return (
    <div className="bm-flex bm-w-full bm-flex-col bm-gap-3 bm-rounded-xl bm-border bm-border-line bm-bg-surface bm-p-3 bm-text-fg">
      {/* Header */}
      <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
        <h2 className="bm-text-[14px] bm-font-semibold">{t("liked_pages_title")}</h2>
        <Badge tone="success">
          {t("liked_pages_loaded_count", {
            loaded: localPages.length,
            total: localPages.length
          })}
        </Badge>
      </div>

      {/* Toolbar */}
      <div className="bm-flex bm-flex-col bm-gap-2 bm-rounded-lg bm-border bm-border-line bm-bg-surface-2/50 bm-p-2.5">
        <Input
          size="sm"
          type="text"
          placeholder={t("liked_pages_search_placeholder")}
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
            {t("liked_pages_reload_button")}
          </Button>

          <Button
            size="sm"
            variant="success"
            onClick={handleExport}
            disabled={!!bulkRunning}
            icon={<Download size={13} />}>
            {t("liked_pages_export_button")} (
            {selectedIds.size > 0 ? selectedIds.size : localPages.length})
          </Button>

          {bulkUnlikeTargets.length > 0 && !bulkRunning && (
            <Button
              size="sm"
              variant="danger"
              onClick={handleBulkUnlike}
              icon={<ThumbsDown size={13} />}>
              {t("liked_pages_bulk_unlike_button", { count: bulkUnlikeTargets.length })}
            </Button>
          )}

          <div className="bm-ml-auto bm-flex bm-items-center bm-gap-1">
            <IconButton
              size="sm"
              variant="outline"
              label={t("liked_pages_refresh_tooltip")}
              onClick={handleReload}>
              <History size={14} />
            </IconButton>
            <IconButton
              size="sm"
              variant="outline"
              label={t("liked_pages_open_facebook_pages_tooltip")}
              onClick={() => window.open("https://facebook.com/pages/?category=liked", "_blank")}>
              <ExternalLink size={14} />
            </IconButton>
          </div>
        </div>

        {/* Bulk progress indicator */}
        {bulkRunning && (
          <div className="bm-flex bm-items-center bm-gap-2 bm-rounded-lg bm-border bm-border-line bm-bg-surface bm-px-2.5 bm-py-1 bm-text-[12px] bm-text-fg-muted">
            <Loader2 size={14} className="bm-shrink-0 bm-animate-spin bm-text-brand-ink" />
            <span className="bm-font-medium">{t("liked_pages_bulk_running_unlike")}</span>
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
              label={t("liked_pages_stop_tooltip")}
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
                  checked={paginatedPages.length > 0 && selectedIds.size === paginatedPages.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className={cn(th, "bm-w-8 bm-text-center")}>#</th>
              <th className={cn(th, "bm-min-w-[160px]")}>
                <div className="bm-flex bm-items-center bm-gap-1">
                  {t("liked_pages_table_header_page")}
                  <ArrowUpDown size={11} className="bm-text-fg-subtle" />
                </div>
              </th>
              <th className={cn(th, "bm-min-w-[100px]")}>
                <div className="bm-flex bm-items-center bm-gap-1">
                  {t("liked_pages_table_header_category")}
                  <Filter size={11} className="bm-text-fg-subtle" />
                </div>
              </th>
              <th className={th}>
                <div className="bm-flex bm-items-center bm-gap-1">
                  {t("liked_pages_table_header_status")}
                  <Filter size={11} className="bm-text-fg-subtle" />
                </div>
              </th>
              <th className={cn(th, "bm-text-center")}>{t("liked_pages_table_header_action")}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPages.length > 0 ? (
              paginatedPages.map((page, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index + 1
                const isSelected = selectedIds.has(page.id)
                const isUnliked = unlikedIds.has(page.id)
                const isUnliking = unlikingIds.has(page.id)
                return (
                  <tr
                    key={page.id}
                    className={cn(
                      "bm-border-b bm-border-line last:bm-border-b-0 bm-transition-colors hover:bm-bg-surface-2/60",
                      isSelected && "bm-bg-brand-soft/60 hover:bm-bg-brand-soft"
                    )}>
                    <td className="bm-px-2 bm-py-2 bm-text-center">
                      <Checkbox
                        size="sm"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(page.id)}
                        disabled={isUnliked}
                      />
                    </td>
                    <td className="bm-px-2 bm-py-2 bm-text-center bm-font-mono bm-text-[11px] bm-text-fg-subtle">
                      {globalIndex}
                    </td>
                    <td className="bm-px-2 bm-py-2">
                      <div className="bm-flex bm-items-center bm-gap-2">
                        <img
                          src={page.avatar}
                          alt={page.name}
                          className="bm-h-8 bm-w-8 bm-shrink-0 bm-rounded-md bm-border bm-border-line bm-bg-surface-2 bm-object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src =
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(page.name)}`
                          }}
                        />
                        <div className="bm-flex bm-min-w-0 bm-flex-col">
                          <div className="bm-flex bm-min-w-0 bm-items-center bm-gap-1">
                            <a
                              href={page.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bm-truncate bm-font-semibold bm-text-brand-ink hover:bm-underline">
                              {page.name}
                            </a>
                            {page.is_verified && (
                              <CheckCircle2 size={13} className="bm-shrink-0 bm-text-brand-ink" />
                            )}
                          </div>
                          <span className="bm-mt-0.5 bm-font-mono bm-text-[10px] bm-tracking-tight bm-text-fg-subtle">
                            {page.uid}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="bm-px-2 bm-py-2 bm-text-[12px] bm-text-fg-muted">
                      {page.category || (
                        <span className="bm-text-[11px] bm-italic bm-text-fg-subtle">
                          {t("liked_pages_no_category")}
                        </span>
                      )}
                    </td>
                    <td className="bm-px-2 bm-py-2">
                      <Badge tone={isUnliked ? "neutral" : "brand"} size="xs">
                        {isUnliked ? t("liked_pages_status_unliked") : page.status}
                      </Badge>
                    </td>
                    <td className="bm-px-2 bm-py-2 bm-text-center">
                      <IconButton
                        size="xs"
                        variant="outline"
                        onClick={() => handleUnlikeOne(page.id, page.name)}
                        disabled={isUnliked || isUnliking}
                        className={cn(
                          !isUnliked &&
                            "bm-border-danger/30 bm-bg-danger-soft bm-text-danger hover:bm-bg-danger-soft hover:bm-brightness-95"
                        )}
                        label={
                          isUnliked
                            ? t("liked_pages_status_unliked")
                            : t("liked_pages_unlike_page_tooltip")
                        }>
                        {isUnliking ? (
                          <Loader2 size={13} className="bm-animate-spin" />
                        ) : (
                          <ThumbsDown size={13} className={cn(isUnliked && "bm-opacity-40")} />
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
                      {t("liked_pages_loading_pages")}
                    </span>
                  ) : (
                    t("liked_pages_empty_table")
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
        totalItems={filteredPages.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
