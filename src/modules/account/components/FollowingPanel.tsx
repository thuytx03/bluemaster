import { exportToCSV } from "src/utils/export.util"
import { normalizeForSearch } from "src/configs/tools.config"
import {
  Download,
  ExternalLink,
  History,
  Loader2,
  RotateCw,
  Search,
  Square,
  Trash2,
  TrendingUp,
  UserMinus,
  UserPlus
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { TableFacebookPagination } from "src/modules/facebook/components/TablePagination"
import { runFacebookBulkAction } from "src/modules/facebook/utils/bulk-action.util"
import { useTranslation } from "react-i18next"
import type { BulkState } from "src/modules/facebook/types/bulk.types"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import { Badge, Button, Callout, Checkbox, cn, IconButton, Input } from "src/modules/shared/ui"

import { useFollowing } from "src/modules/account/hooks/useFollowing"
import type { Follower } from "src/modules/account/types/following.types"

type FollowingBulkState = BulkState<"unfollow" | "refollow">

const removeFromSet = (prev: Set<string>, id: string) => {
  const s = new Set(prev)
  s.delete(id)
  return s
}

export function FollowingPanel() {
  const { t } = useTranslation()
  const { profile } = useFacebook()
  const { state, error, followings: apiFollowers, load, unFollowing, reFollowing } = useFollowing()
  const [localFollowings, setLocalFollowings] = useState<Follower[]>([])
  const [unfollowedIds, setUnfollowedIds] = useState<Set<string>>(new Set())
  const [unfollowingIds, setUnfollowingIds] = useState<Set<string>>(new Set())
  // UI state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  // Bulk state
  const bulkStopRef = useRef(false)
  const [bulkRunning, setBulkRunning] = useState<FollowingBulkState | null>(null)

  useEffect(() => {
    if (profile?.uid) {
      load({ cursor: null, accumulate: false, forceRefresh: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid])

  // Update local list when API loads data
  useEffect(() => {
    if (apiFollowers && apiFollowers.length > 0) {
      setLocalFollowings(apiFollowers)
    }
  }, [apiFollowers])

  const handleReload = () => {
    load({ cursor: null, accumulate: false, forceRefresh: true })
  }

  // Filtered list
  const filteredFollowings = useMemo(() => {
    const query = normalizeForSearch(searchQuery)
    return localFollowings.filter(
      (following) =>
        normalizeForSearch(following.name).includes(query) ||
        following.uid.includes(query) ||
        normalizeForSearch(following.description).includes(query)
    )
  }, [localFollowings, searchQuery])

  // Pagination
  const paginatedFollowings = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredFollowings.slice(startIndex, startIndex + pageSize)
  }, [filteredFollowings, currentPage, pageSize])

  const totalPages = Math.ceil(filteredFollowings.length / pageSize)

  // Reset current page when filter or page size changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedFollowings.length) {
      setSelectedIds(new Set())
    } else {
      const newSelection = new Set<string>()
      paginatedFollowings.forEach((f) => newSelection.add(f.id))
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

  const handleUnfollowOne = async (id: string, name: string) => {
    setUnfollowingIds((prev) => new Set(prev).add(id))
    const success = await unFollowing(id)
    setUnfollowingIds((prev) => removeFromSet(prev, id))
    if (success) {
      setUnfollowedIds((prev) => new Set(prev).add(id))
      toast.success(t("following_toast_unfollow_success", { name }))
    } else {
      toast.error(t("following_toast_unfollow_failed", { name }))
    }
  }

  const handleReFollowOne = async (id: string, name: string) => {
    setUnfollowingIds((prev) => new Set(prev).add(id))
    const success = await reFollowing(id)
    setUnfollowingIds((prev) => removeFromSet(prev, id))
    if (success) {
      setUnfollowedIds((prev) => removeFromSet(prev, id))
      toast.success(t("following_toast_refollow_success", { name }))
    } else {
      toast.error(t("following_toast_refollow_failed", { name }))
    }
  }

  // Bulk targets derived from selection + state
  const bulkUnfollowTargets = useMemo(
    () => Array.from(selectedIds).filter((id) => !unfollowedIds.has(id)),
    [selectedIds, unfollowedIds]
  )
  const bulkReFollowTargets = useMemo(
    () => Array.from(selectedIds).filter((id) => unfollowedIds.has(id)),
    [selectedIds, unfollowedIds]
  )

  const handleBulkUnfollow = async () => {
    const targets = bulkUnfollowTargets
    if (targets.length === 0) return

    await runFacebookBulkAction({
      targets,
      actionType: "unfollow",
      bulkStopRef,
      setBulkRunning,
      executeSingle: async (id) => {
        setUnfollowingIds((prev) => new Set(prev).add(id))
        const ok = await unFollowing(id)
        setUnfollowingIds((prev) => removeFromSet(prev, id))
        if (ok) {
          setUnfollowedIds((prev) => new Set(prev).add(id))
          return true
        }
        return false
      },
      onFinished: (success, fail) => {
        toast.success(t("following_toast_bulk_unfollow_result", { success, fail }))
      }
    })
  }

  const handleBulkReFollow = async () => {
    const targets = bulkReFollowTargets
    if (targets.length === 0) return

    await runFacebookBulkAction({
      targets,
      actionType: "refollow",
      bulkStopRef,
      setBulkRunning,
      executeSingle: async (id) => {
        setUnfollowingIds((prev) => new Set(prev).add(id))
        const ok = await reFollowing(id)
        setUnfollowingIds((prev) => removeFromSet(prev, id))
        if (ok) {
          setUnfollowedIds((prev) => removeFromSet(prev, id))
          return true
        }
        return false
      },
      onFinished: (success, fail) => {
        toast.success(t("following_toast_bulk_refollow_result", { success, fail }))
      }
    })
  }

  const stopBulk = () => {
    bulkStopRef.current = true
  }

  // CSV export handler
  const handleExport = () => {
    const listToExport =
      selectedIds.size > 0 ? localFollowings.filter((f) => selectedIds.has(f.id)) : localFollowings

    if (listToExport.length === 0) {
      toast.error(t("following_toast_export_empty"))
      return
    }

    const headers = [
      t("following_csv_header_index"),
      t("following_csv_header_uid"),
      t("following_csv_header_name"),
      t("following_csv_header_description"),
      t("following_csv_header_type"),
      t("following_csv_header_status")
    ]
    const csvRows = listToExport.map((f, idx) => [idx + 1, f.uid, f.name, f.description, f.type, f.status])

    exportToCSV(headers, csvRows, `danh_sach_nguoi_theo_doi_${Date.now()}.csv`)
    toast.success(t("following_toast_export_success", { count: listToExport.length }))
  }

  const allPageSelected = paginatedFollowings.length > 0 && selectedIds.size === paginatedFollowings.length

  return (
    <div className="bm-flex bm-w-full bm-flex-col bm-gap-3">
      {/* Header */}
      <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
        <span className="bm-text-[13.5px] bm-font-semibold bm-text-fg">{t("following_status_following")}</span>
        <Badge tone="success">
          {t("following_loaded_count", { loaded: localFollowings.length, total: localFollowings.length })}
        </Badge>
        {state === "loading" && <Loader2 size={14} className="bm-animate-spin bm-text-fg-muted" />}
      </div>

      {state === "error" && error && (
        <Callout tone="danger" compact>
          {error}
        </Callout>
      )}

      {/* Toolbar */}
      <div className="bm-flex bm-flex-col bm-gap-2 bm-rounded-xl bm-border bm-border-line bm-bg-surface-2/60 bm-p-2.5">
        <Input
          size="sm"
          type="text"
          placeholder={t("following_search_placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          suffix={<Search size={14} className="bm-text-fg-subtle" />}
        />

        <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-1.5">
          <Button
            size="xs"
            variant="primary"
            onClick={handleReload}
            disabled={state === "loading" || !!bulkRunning}
            icon={<RotateCw size={13} className={state === "loading" ? "bm-animate-spin" : ""} />}>
            {t("following_reload_button")}
          </Button>

          <Button
            size="xs"
            variant="success"
            onClick={handleExport}
            disabled={!!bulkRunning}
            icon={<Download size={13} />}>
            {t("following_export_button")} ({selectedIds.size > 0 ? selectedIds.size : localFollowings.length})
          </Button>

          {bulkUnfollowTargets.length > 0 && !bulkRunning && (
            <Button size="xs" variant="danger" onClick={handleBulkUnfollow} icon={<UserMinus size={13} />}>
              {t("following_bulk_unfollow_button", { count: bulkUnfollowTargets.length })}
            </Button>
          )}

          {bulkReFollowTargets.length > 0 && !bulkRunning && (
            <Button size="xs" variant="success" onClick={handleBulkReFollow} icon={<UserPlus size={13} />}>
              {t("following_bulk_refollow_button", { count: bulkReFollowTargets.length })}
            </Button>
          )}

          <div className="bm-ml-auto bm-flex bm-items-center bm-gap-0.5">
            <IconButton size="xs" label={t("following_reload_tooltip")} onClick={handleReload}>
              <History size={13} />
            </IconButton>
            <IconButton
              size="xs"
              label={t("following_analytics_tooltip")}
              onClick={() => toast(t("following_toast_feature_developing"))}>
              <TrendingUp size={13} />
            </IconButton>
            <IconButton
              size="xs"
              label={t("following_open_facebook_tooltip")}
              onClick={() => window.open("https://facebook.com", "_blank")}>
              <ExternalLink size={13} />
            </IconButton>
          </div>
        </div>

        {bulkRunning && (
          <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2 bm-rounded-lg bm-border bm-border-line bm-bg-surface bm-px-2.5 bm-py-1 bm-text-[12px] bm-text-fg-muted">
            <Loader2 size={13} className="bm-shrink-0 bm-animate-spin bm-text-brand-ink" />
            <span className="bm-font-medium">
              {bulkRunning.type === "unfollow"
                ? t("following_bulk_running_unfollow")
                : t("following_bulk_running_refollow")}
            </span>
            <span className="bm-font-mono">
              {bulkRunning.current}/{bulkRunning.total}
            </span>
            <span className="bm-font-medium bm-text-success">✓{bulkRunning.success}</span>
            {bulkRunning.fail > 0 && <span className="bm-font-medium bm-text-danger">✗{bulkRunning.fail}</span>}
            <IconButton
              size="xs"
              variant="danger"
              className="bm-ml-auto bm-h-6 bm-w-6"
              label={t("following_stop_tooltip")}
              onClick={stopBulk}>
              <Square size={11} />
            </IconButton>
          </div>
        )}
      </div>

      {/* List */}
      <div className="bm-overflow-hidden bm-rounded-xl bm-border bm-border-line bm-bg-surface">
        <div className="bm-flex bm-items-center bm-gap-2 bm-border-b bm-border-line bm-bg-surface-2 bm-px-3 bm-py-2 bm-text-[11px] bm-font-semibold bm-uppercase bm-tracking-wide bm-text-fg-muted">
          <Checkbox size="sm" checked={allPageSelected} onChange={toggleSelectAll} />
          <span className="bm-w-6 bm-text-center">#</span>
          <span className="bm-flex-1">{t("following_table_header_name")}</span>
          <span className="bm-w-8 bm-text-center">{t("following_table_header_action")}</span>
        </div>

        {paginatedFollowings.length > 0 ? (
          <ul className="bm-divide-y bm-divide-line">
            {paginatedFollowings.map((following, index) => {
              const globalIndex = (currentPage - 1) * pageSize + index + 1
              const isSelected = selectedIds.has(following.id)
              const isUnfollowed = unfollowedIds.has(following.id)
              const isBusy = unfollowingIds.has(following.id)
              return (
                <li
                  key={following.id}
                  className={cn(
                    "bm-flex bm-items-start bm-gap-2 bm-px-3 bm-py-2 bm-transition-colors hover:bm-bg-surface-2",
                    isSelected && "bm-bg-brand-soft/50 hover:bm-bg-brand-soft/70"
                  )}>
                  <div className="bm-pt-2.5">
                    <Checkbox size="sm" checked={isSelected} onChange={() => toggleSelectOne(following.id)} />
                  </div>
                  <span className="bm-w-6 bm-pt-2.5 bm-text-center bm-font-mono bm-text-[11px] bm-text-fg-subtle">
                    {globalIndex}
                  </span>
                  <img
                    src={following.avatar}
                    alt={following.name}
                    className="bm-h-9 bm-w-9 bm-shrink-0 bm-rounded-lg bm-border bm-border-line bm-bg-surface-2 bm-object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src =
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(following.name)}`
                    }}
                  />
                  <div className="bm-flex bm-min-w-0 bm-flex-1 bm-flex-col bm-gap-0.5">
                    <a
                      href={`https://facebook.com/${following.uid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bm-truncate bm-text-[13px] bm-font-semibold bm-text-brand-ink hover:bm-underline">
                      {following.name}
                    </a>
                    <span className="bm-font-mono bm-text-[10.5px] bm-text-fg-subtle">{following.uid}</span>
                    <span
                      className="bm-truncate bm-text-[12px] bm-text-fg-muted"
                      title={following.description}>
                      {following.description || (
                        <span className="bm-italic bm-text-fg-subtle">{t("following_no_description")}</span>
                      )}
                    </span>
                    <div className="bm-mt-0.5 bm-flex bm-flex-wrap bm-items-center bm-gap-1.5 bm-text-[11px] bm-text-fg-muted">
                      <Badge size="xs" tone="neutral" title={t("following_table_header_type")}>
                        {following.type}
                      </Badge>
                      <Badge size="xs" tone="outline" title={t("following_table_header_friends")}>
                        {t("following_table_header_friends")}: {following.friends}
                      </Badge>
                      <Badge size="xs" tone={isUnfollowed ? "neutral" : "success"} title={t("following_table_header_status")}>
                        {isUnfollowed ? t("following_status_unfollowed") : following.status}
                      </Badge>
                    </div>
                  </div>
                  <IconButton
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    className={cn(
                      "bm-mt-0.5",
                      isUnfollowed
                        ? "bm-border-success/30 bm-bg-success-soft bm-text-success hover:bm-bg-success-soft"
                        : "bm-border-danger/30 bm-bg-danger-soft bm-text-danger hover:bm-bg-danger-soft"
                    )}
                    label={
                      isUnfollowed ? t("following_status_unfollowed") : t("following_unfollow_tooltip")
                    }
                    onClick={() =>
                      isUnfollowed
                        ? handleReFollowOne(following.id, following.name)
                        : handleUnfollowOne(following.id, following.name)
                    }>
                    {isBusy ? (
                      <Loader2 size={13} className="bm-animate-spin" />
                    ) : isUnfollowed ? (
                      <UserPlus size={13} />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </IconButton>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="bm-p-8 bm-text-center bm-text-[12.5px] bm-italic bm-text-fg-muted">
            {state === "loading" ? <Loader2 size={16} className="bm-mx-auto bm-animate-spin" /> : t("following_empty_table")}
          </div>
        )}
      </div>

      <TableFacebookPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredFollowings.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
