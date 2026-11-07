import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Heart,
  MessageCircle,
  Repeat2
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  PostThumb,
  PostTypeBadge
} from "src/modules/automation/components/post-radar/PostRadarParts"
import type {
  RadarPost,
  RadarSortDir,
  RadarSortKey
} from "src/modules/automation/types/post-radar.types"
import {
  formatDateTime,
  formatNumber,
  sortRadarRows
} from "src/modules/automation/utils/post-radar.util"
import { TableFacebookPagination } from "src/modules/facebook/components/TablePagination"
import { Checkbox, cn, IconButton, Select } from "src/modules/shared/ui"

interface Row {
  p: RadarPost
  i: number
}

/**
 * Scanned posts as a compact list (the source's 11-column table does not fit
 * the sidebar): sort select replaces the clickable column headers.
 */
export default function PostRadarPostTable({
  rows,
  selected,
  onToggle,
  onSelectAll
}: {
  rows: Row[]
  selected: Set<number>
  onToggle: (idx: number) => void
  onSelectAll: (checked: boolean) => void
}) {
  const { t } = useTranslation()
  const [sortKey, setSortKey] = useState<RadarSortKey>("createdTime")
  const [sortDir, setSortDir] = useState<RadarSortDir>("desc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const sorted = useMemo(
    () => sortRadarRows(rows, sortKey, sortDir),
    [rows, sortKey, sortDir]
  )
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize)

  const allChecked = rows.length > 0 && rows.every(({ i }) => selected.has(i))
  const someChecked = !allChecked && rows.some(({ i }) => selected.has(i))

  const sortOptions: { value: RadarSortKey; label: string }[] = [
    { value: "createdTime", label: t("post_radar_col_time") },
    { value: "postId", label: t("post_radar_col_post_id") },
    { value: "likeCount", label: t("post_radar_col_like") },
    { value: "commentCount", label: t("post_radar_col_comment") },
    { value: "shareCount", label: t("post_radar_col_share") }
  ]

  return (
    <div className="bm-flex bm-flex-col">
      <div className="bm-flex bm-items-center bm-justify-between bm-gap-2 bm-rounded-t-xl bm-border bm-border-line bm-bg-surface-2/50 bm-px-2.5 bm-py-1.5">
        <Checkbox
          size="sm"
          checked={allChecked}
          indeterminate={someChecked}
          onChange={onSelectAll}
          label={
            <span className="bm-text-[12px] bm-text-fg-muted">
              {t("post_radar_select_all")}
            </span>
          }
        />
        <div className="bm-flex bm-items-center bm-gap-1">
          <Select<RadarSortKey>
            size="sm"
            className="bm-w-[130px]"
            value={sortKey}
            onChange={(v) => {
              setSortKey(v)
              setSortDir("desc")
            }}
            options={sortOptions}
          />
          <IconButton
            size="sm"
            variant="outline"
            label={t(
              sortDir === "desc"
                ? "post_radar_sort_desc"
                : "post_radar_sort_asc"
            )}
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}>
            {sortDir === "desc" ? (
              <ArrowDownWideNarrow size={14} />
            ) : (
              <ArrowUpNarrowWide size={14} />
            )}
          </IconButton>
        </div>
      </div>

      <ul className="bm-divide-y bm-divide-line bm-overflow-hidden bm-rounded-b-xl bm-border bm-border-t-0 bm-border-line bm-bg-surface">
        {pageRows.map(({ p, i }, rowIdx) => {
          const isSel = selected.has(i)
          return (
            <li
              key={p.postId + i}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("a,button,label")) return
                onToggle(i)
              }}
              className={cn(
                "bm-flex bm-cursor-pointer bm-gap-2 bm-px-2.5 bm-py-2 bm-transition-colors hover:bm-bg-surface-2/60",
                isSel && "bm-bg-brand-soft/40 hover:bm-bg-brand-soft/60"
              )}>
              <div className="bm-flex bm-flex-col bm-items-center bm-gap-1 bm-pt-0.5">
                <Checkbox
                  size="sm"
                  checked={isSel}
                  onChange={() => onToggle(i)}
                />
                <span className="bm-text-[10px] bm-text-fg-subtle">
                  {(page - 1) * pageSize + rowIdx + 1}
                </span>
              </div>
              <PostThumb src={p.imageUrl} size={44} />
              <div className="bm-min-w-0 bm-flex-1">
                <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-1.5 bm-text-[11px] bm-text-fg-muted">
                  <PostTypeBadge postType={p.postType} />
                  <span className="bm-max-w-[140px] bm-truncate bm-font-medium bm-text-fg">
                    {p.authorName || "—"}
                  </span>
                  <span className="bm-whitespace-nowrap">
                    {formatDateTime(p.createdTime)}
                  </span>
                </div>
                {p.message ? (
                  <a
                    href={p.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bm-mt-0.5 bm-line-clamp-2 bm-break-words bm-text-[12px] bm-text-brand-ink hover:bm-underline">
                    {p.message.slice(0, 180)}
                    {p.message.length > 180 ? "…" : ""}
                  </a>
                ) : (
                  <em className="bm-mt-0.5 bm-block bm-text-[12px] bm-text-fg-subtle">
                    {t("post_radar_no_content")}
                  </em>
                )}
                <div className="bm-mt-1 bm-flex bm-flex-wrap bm-items-center bm-gap-x-3 bm-gap-y-0.5 bm-text-[11px] bm-text-fg-muted">
                  <a
                    href={p.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bm-max-w-[150px] bm-truncate bm-font-mono bm-text-[10.5px] bm-text-brand-ink hover:bm-underline">
                    {p.postId}
                  </a>
                  <span className="bm-inline-flex bm-items-center bm-gap-1">
                    <Heart size={11} className="bm-text-danger" />
                    {formatNumber(p.likeCount)}
                  </span>
                  <span className="bm-inline-flex bm-items-center bm-gap-1">
                    <MessageCircle size={11} />
                    {formatNumber(p.commentCount)}
                  </span>
                  <span className="bm-inline-flex bm-items-center bm-gap-1">
                    <Repeat2 size={11} />
                    {formatNumber(p.shareCount)}
                  </span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {sorted.length > pageSize && (
        <TableFacebookPagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={sorted.length}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s)
            setPage(1)
          }}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      )}
    </div>
  )
}
