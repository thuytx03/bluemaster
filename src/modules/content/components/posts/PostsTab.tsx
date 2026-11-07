import { ChevronDown, Loader2, RotateCw, Search, SlidersHorizontal, Square, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { getActionLabel, getPostActionItems, getTypeOptionLabel, PostRow, TH } from "src/modules/content/components/posts/PostRow"
import type {
  Post,
  PostAction,
  PostPrivacyFilter,
  PostsBulkState,
  PostsLoadOptions,
  PostsLoadState,
  PostTypeFilter
} from "src/modules/content/types/posts.types"
import { filterPosts, truncatePostText } from "src/modules/content/utils/posts.util"
import DateRangeField from "src/modules/download/components/DateRangeField"
import type { TDateRange } from "src/modules/download/types/download.types"
import { TableFacebookPagination } from "src/modules/facebook/components/TablePagination"
import { runFacebookBulkAction } from "src/modules/facebook/utils/bulk-action.util"
import { Button, Checkbox, cn, ConfirmDialog, Dropdown, IconButton, Input, Select } from "src/modules/shared/ui"

interface PostsTabProps {
  posts: Post[]
  state: PostsLoadState
  hasNextPage: boolean
  endCursor: string | null
  load: (options?: PostsLoadOptions) => Promise<void>
  runAction: (type: PostAction, storyId: string) => Promise<boolean>
}

interface ConfirmState {
  type: PostAction
  storyId?: string
  name?: string
  ids?: string[]
}

const removeFromSet = (prev: Set<string>, id: string) => {
  const s = new Set(prev)
  s.delete(id)
  return s
}

/** Port of xthuy-social `posts/components/PostsTab`. */
export function PostsTab({ posts, state, hasNextPage, endCursor, load, runAction }: PostsTabProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [processedIds, setProcessedIds] = useState<Map<string, "success" | "error">>(new Map())
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [bulkRunning, setBulkRunning] = useState<PostsBulkState | null>(null)
  const bulkStopRef = useRef<boolean>(false)

  const [filterType, setFilterType] = useState<PostTypeFilter>("all")
  const [filterPrivacy, setFilterPrivacy] = useState<PostPrivacyFilter>("all")
  const [dateRange, setDateRange] = useState<TDateRange | null>(null)

  const [confirmAction, setConfirmAction] = useState<ConfirmState | null>(null)

  const filteredPosts = useMemo(
    () => filterPosts(posts, { search: searchQuery, type: filterType, privacy: filterPrivacy, dateRange }),
    [posts, searchQuery, filterType, filterPrivacy, dateRange]
  )

  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredPosts.slice(start, start + pageSize)
  }, [filteredPosts, currentPage, pageSize])

  const totalPages = Math.ceil(filteredPosts.length / pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize, filterType, filterPrivacy, dateRange])

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedPosts.length && paginatedPosts.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedPosts.map((p) => p.storyId)))
    }
  }

  const toggleSelectOne = (storyId: string) => {
    const next = new Set(selectedIds)
    if (next.has(storyId)) next.delete(storyId)
    else next.add(storyId)
    setSelectedIds(next)
  }

  /** Runs one action with the per-row spinner + processed marker; shared by single and bulk runs. */
  const executeOne = async (type: PostAction, storyId: string): Promise<boolean> => {
    setProcessingIds((prev) => new Set(prev).add(storyId))
    const ok = await runAction(type, storyId)
    setProcessingIds((prev) => removeFromSet(prev, storyId))
    setProcessedIds((prev) => new Map(prev).set(storyId, ok ? "success" : "error"))
    return ok
  }

  // ---- Single action ----
  const handleSingleAction = (type: PostAction, post: Post) => {
    setConfirmAction({
      type,
      storyId: post.storyId,
      name: truncatePostText(post.message, 60) ?? t("posts_no_content")
    })
  }

  const executeSingleAction = async (type: PostAction, storyId: string) => {
    const ok = await executeOne(type, storyId)
    if (ok) toast.success(t("posts_toast_action_success", { action: getActionLabel(t, type) }))
    else toast.error(t("posts_toast_action_failed", { action: getActionLabel(t, type) }))
  }

  // ---- Bulk action ----
  const handleBulkAction = (type: PostAction) => {
    const targets = Array.from(selectedIds).filter((id) => !processedIds.has(id))
    if (targets.length === 0) return
    setConfirmAction({ type, ids: targets })
  }

  const executeBulkAction = async (type: PostAction, ids: string[]) => {
    await runFacebookBulkAction({
      targets: ids,
      actionType: type,
      bulkStopRef,
      setBulkRunning,
      executeSingle: (id) => executeOne(type, id),
      onFinished: (success, fail) => {
        setSelectedIds(new Set())
        const successPart = t("posts_toast_bulk_success_part", { action: getActionLabel(t, type), count: success })
        const failPart = fail > 0 ? t("posts_toast_bulk_fail_part", { count: fail }) : ""
        toast.success(`${successPart}${failPart}`)
      }
    })
  }

  const handleConfirm = async () => {
    if (!confirmAction) return
    const { type, storyId, ids } = confirmAction
    setConfirmAction(null)
    if (storyId) {
      await executeSingleAction(type, storyId)
    } else if (ids) {
      await executeBulkAction(type, ids)
    }
  }

  const stopBulk = () => {
    bulkStopRef.current = true
  }

  const handleLoadMore = () => {
    if (hasNextPage && endCursor) {
      load({ cursor: endCursor, accumulate: true })
    }
  }

  const selectableCount = paginatedPosts.filter((p) => !processedIds.has(p.storyId)).length
  const selectedCount = Array.from(selectedIds).filter((id) => !processedIds.has(id)).length
  const hasActiveFilters = filterType !== "all" || filterPrivacy !== "all" || !!dateRange?.[0] || !!dateRange?.[1]

  const clearFilters = () => {
    setFilterType("all")
    setFilterPrivacy("all")
    setDateRange(null)
  }

  const confirmType = confirmAction?.type
  const confirmDescription = (
    <div className="bm-space-y-2">
      {confirmType === "delete" && <p className="bm-font-semibold bm-text-danger">⚠️ {t("posts_confirm_desc_delete")}</p>}
      {confirmType === "hide" && <p>{t("posts_confirm_desc_hide")}</p>}
      {confirmType === "archive" && <p>{t("posts_confirm_desc_archive")}</p>}
      {confirmType === "trash" && <p>{t("posts_confirm_desc_trash")}</p>}
      {confirmAction?.name && <p className="bm-truncate bm-text-[11.5px] bm-italic bm-text-fg-subtle">"{confirmAction.name}"</p>}
    </div>
  )

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      {/* Toolbar */}
      <div className="bm-flex bm-flex-col bm-gap-2.5 bm-rounded-xl bm-border bm-border-line bm-bg-surface-2/40 bm-p-2.5">
        <div className="bm-flex bm-items-center bm-gap-2">
          <Input
            size="sm"
            className="bm-flex-1"
            placeholder={t("posts_search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            suffix={<Search size={13} />}
          />
          {hasNextPage && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleLoadMore}
              disabled={state === "loading" || !!bulkRunning}
              icon={state === "loading" ? <Loader2 size={13} className="bm-animate-spin" /> : <ChevronDown size={13} />}>
              {t("posts_load_more")}
            </Button>
          )}
        </div>

        <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
          <Button
            size="xs"
            variant="primary"
            onClick={() => load({ cursor: null, accumulate: false, forceRefresh: true })}
            disabled={state === "loading" || !!bulkRunning}
            icon={<RotateCw size={13} className={state === "loading" ? "bm-animate-spin" : ""} />}>
            {t("posts_reload")}
          </Button>

          {selectedCount > 0 && !bulkRunning && (
            <Dropdown items={getPostActionItems(t, handleBulkAction, { full: false })} placement="bottom-start" minWidth={200}>
              <Button
                size="xs"
                variant="outline"
                className="bm-border-warning/40 bm-text-warning"
                iconRight={<ChevronDown size={13} />}>
                {t("posts_actions_button", { count: selectedCount })}
              </Button>
            </Dropdown>
          )}
        </div>

        {bulkRunning && (
          <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2 bm-rounded-lg bm-border bm-border-line bm-bg-surface bm-px-2.5 bm-py-1 bm-text-[12px] bm-text-fg-muted">
            <Loader2 size={14} className="bm-shrink-0 bm-animate-spin bm-text-brand" />
            <span className="bm-font-medium">{getActionLabel(t, bulkRunning.type)}</span>
            <span className="bm-font-mono">
              {bulkRunning.current}/{bulkRunning.total}
            </span>
            <span className="bm-font-medium bm-text-success">✓{bulkRunning.success}</span>
            {bulkRunning.fail > 0 && <span className="bm-font-medium bm-text-danger">✗{bulkRunning.fail}</span>}
            <IconButton
              size="xs"
              variant="ghost"
              label={t("posts_stop")}
              onClick={stopBulk}
              className="bm-ml-auto bm-h-6 bm-w-6 hover:bm-bg-danger-soft hover:bm-text-danger">
              <Square size={12} />
            </IconButton>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bm-flex bm-flex-col bm-gap-2 bm-rounded-xl bm-border bm-border-line bm-bg-surface-2/20 bm-p-2.5">
        <div className="bm-flex bm-items-center bm-gap-1.5 bm-text-fg-muted">
          <SlidersHorizontal size={13} />
          <span className="bm-text-[12px] bm-font-medium">{t("posts_filter_label")}</span>
          {hasActiveFilters && (
            <>
              <span className="bm-ml-auto bm-text-[11.5px]">
                {t("posts_filter_count", { filtered: filteredPosts.length, total: posts.length })}
              </span>
              <Button size="xs" variant="ghost" onClick={clearFilters} icon={<X size={12} />}>
                {t("posts_clear_filters")}
              </Button>
            </>
          )}
        </div>
        <div className="bm-grid bm-grid-cols-2 bm-gap-2">
          <Select<PostTypeFilter>
            size="sm"
            value={filterType}
            onChange={setFilterType}
            placeholder={t("posts_filter_type_placeholder")}
            options={[
              { value: "all", label: t("posts_filter_type_all") },
              { value: "own", label: getTypeOptionLabel(t, "own") },
              { value: "share", label: getTypeOptionLabel(t, "share") },
              { value: "tagged", label: getTypeOptionLabel(t, "tagged") }
            ]}
          />
          <Select<PostPrivacyFilter>
            size="sm"
            value={filterPrivacy}
            onChange={setFilterPrivacy}
            placeholder={t("posts_filter_privacy_placeholder")}
            options={[
              { value: "all", label: t("posts_filter_privacy_all") },
              { value: "EVERYONE", label: t("posts_privacy_everyone") },
              { value: "FRIENDS", label: t("posts_privacy_friends") },
              { value: "ONLY_ME", label: t("posts_privacy_only_me") },
              { value: "CUSTOM", label: t("posts_privacy_custom") }
            ]}
          />
        </div>
        <DateRangeField value={dateRange} onChange={setDateRange} className="bm-h-8" />
      </div>

      {/* Table */}
      <div className="bm-overflow-x-auto bm-rounded-xl bm-border bm-border-line bm-bg-surface">
        <table className="bm-w-full bm-border-collapse bm-text-[12px] bm-text-fg">
          <thead className="bm-select-none bm-bg-surface-2/60">
            <tr>
              <th className={cn(TH, "bm-w-8 bm-text-center")}>
                <Checkbox
                  size="sm"
                  checked={selectableCount > 0 && selectedCount === selectableCount}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className={cn(TH, "bm-w-8 bm-text-center")}>#</th>
              <th className={TH}>{t("posts_column_content")}</th>
              <th className={cn(TH, "bm-w-10 bm-text-center")}>{t("posts_column_action")}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPosts.length > 0 ? (
              paginatedPosts.map((post, index) => (
                <PostRow
                  key={post.storyId}
                  post={post}
                  index={(currentPage - 1) * pageSize + index + 1}
                  selected={selectedIds.has(post.storyId)}
                  processing={processingIds.has(post.storyId)}
                  processed={processedIds.get(post.storyId)}
                  bulkRunning={!!bulkRunning}
                  onToggle={() => toggleSelectOne(post.storyId)}
                  onAction={(type) => handleSingleAction(type, post)}
                />
              ))
            ) : (
              <tr>
                <td colSpan={4} className="bm-p-8 bm-text-center bm-italic bm-text-fg-muted">
                  {state === "loading" ? t("posts_loading_posts") : t("posts_no_posts_found")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <TableFacebookPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredPosts.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          confirmAction?.ids
            ? t("posts_confirm_title_bulk", {
                action: getActionLabel(t, confirmAction.type),
                count: confirmAction.ids.length
              })
            : t("posts_confirm_title_single", { action: getActionLabel(t, confirmType ?? "delete") })
        }
        description={confirmDescription}
        destructive={confirmType === "delete" || confirmType === "trash"}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
