import { ReactNode, useEffect, useState } from "react"

import type { BotCommentGroup } from "src/modules/automation/types/auto-bot-comment.types"
import { TableFacebookPagination } from "src/modules/facebook/components/TablePagination"
import { Avatar, Checkbox, cn } from "src/modules/shared/ui"

/** Paginated, checkable list of groups (replaces the source 3-column grid capped at 150). */
export default function GroupPickList({
  groups,
  isSelected,
  onToggle,
  renderAction
}: {
  groups: BotCommentGroup[]
  isSelected: (groupId: string) => boolean
  onToggle: (g: BotCommentGroup) => void
  renderAction?: (g: BotCommentGroup) => ReactNode
}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const totalPages = Math.max(1, Math.ceil(groups.length / pageSize))

  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [page, totalPages])

  if (groups.length === 0) return null
  const rows = groups.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="bm-flex bm-flex-col bm-gap-2">
      <div className="bm-flex bm-flex-col bm-gap-1">
        {rows.map((g) => {
          const checked = isSelected(g.groupId)
          return (
            <div
              key={g.groupId}
              onClick={() => onToggle(g)}
              className={cn(
                "bm-flex bm-cursor-pointer bm-items-center bm-gap-2.5 bm-rounded-xl bm-border bm-p-2 bm-transition-colors",
                checked
                  ? "bm-border-brand/50 bm-bg-brand-soft/50"
                  : "bm-border-line bm-bg-surface hover:bm-bg-surface-2"
              )}>
              <Checkbox
                size="sm"
                checked={checked}
                onChange={() => onToggle(g)}
              />
              <Avatar
                src={g.avatarUrl}
                name={g.groupName}
                size={30}
                rounded="xl"
              />
              <div className="bm-min-w-0 bm-flex-1">
                <a
                  href={`https://www.facebook.com/groups/${g.groupId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="bm-block bm-truncate bm-text-[12.5px] bm-font-medium bm-text-fg hover:bm-text-brand-ink hover:bm-underline">
                  {g.groupName}
                </a>
                <p className="bm-font-mono bm-text-[10.5px] bm-text-fg-subtle">
                  {g.groupId}
                </p>
              </div>
              {renderAction && (
                <div
                  className="bm-shrink-0"
                  onClick={(e) => e.stopPropagation()}>
                  {renderAction(g)}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {groups.length > pageSize || pageSize !== 20 ? (
        <TableFacebookPagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={groups.length}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s)
            setPage(1)
          }}
          pageSizeOptions={[20, 50, 100]}
        />
      ) : null}
    </div>
  )
}
