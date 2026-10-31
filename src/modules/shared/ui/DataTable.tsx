import { ChevronLeft, ChevronRight } from "lucide-react"
import { ReactNode, useEffect, useMemo, useState } from "react"

import { cn } from "./cn"
import EmptyState from "./EmptyState"

export interface DataColumn<T> {
  key: string
  title: ReactNode
  width?: number | string
  align?: "left" | "center" | "right"
  render: (row: T, index: number) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: DataColumn<T>[]
  rows: T[]
  rowKey: (row: T, index: number) => string
  pageSize?: number
  emptyTitle?: ReactNode
  emptyDescription?: ReactNode
  emptyIcon?: ReactNode
  className?: string
  maxHeight?: number
  dense?: boolean
  rowClassName?: (row: T) => string | undefined
}

function DataTable<T>({
  columns,
  rows,
  rowKey,
  pageSize,
  emptyTitle = "Chưa có dữ liệu",
  emptyDescription,
  emptyIcon,
  className,
  maxHeight,
  dense,
  rowClassName
}: DataTableProps<T>) {
  const [page, setPage] = useState(0)
  const pages = pageSize ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1

  useEffect(() => {
    if (page > pages - 1) setPage(Math.max(0, pages - 1))
  }, [pages, page])

  const visible = useMemo(() => {
    if (!pageSize) return rows
    return rows.slice(page * pageSize, page * pageSize + pageSize)
  }, [rows, page, pageSize])

  return (
    <div
      className={cn(
        "bm-overflow-hidden bm-rounded-xl2 bm-border bm-border-line bm-bg-surface",
        className
      )}>
      <div className="bm-overflow-auto" style={{ maxHeight }}>
        <table className="bm-w-full bm-border-collapse bm-text-left bm-text-[12.5px]">
          <thead className="bm-sticky bm-top-0 bm-z-[1] bm-bg-surface-2/95 bm-backdrop-blur">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width }}
                  className={cn(
                    "bm-whitespace-nowrap bm-border-b bm-border-line bm-px-3 bm-py-2 bm-text-[10.5px] bm-font-semibold bm-uppercase bm-tracking-wider bm-text-fg-muted",
                    c.align === "right" && "bm-text-right",
                    c.align === "center" && "bm-text-center"
                  )}>
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                className={cn(
                  "bm-border-b bm-border-line/70 bm-transition-colors last:bm-border-b-0 hover:bm-bg-surface-2/60",
                  rowClassName?.(row)
                )}>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "bm-px-3 bm-align-middle",
                      dense ? "bm-py-1.5" : "bm-py-2.5",
                      c.align === "right" && "bm-text-right",
                      c.align === "center" && "bm-text-center",
                      c.className
                    )}>
                    {c.render(row, (pageSize ? page * pageSize : 0) + i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <EmptyState
            compact
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        )}
      </div>
      {pageSize && rows.length > pageSize && (
        <div className="bm-flex bm-items-center bm-justify-between bm-border-t bm-border-line bm-bg-surface-2/50 bm-px-3 bm-py-1.5 bm-text-[11.5px] bm-text-fg-muted">
          <span>
            {page * pageSize + 1}–{Math.min(rows.length, (page + 1) * pageSize)} / {rows.length}
          </span>
          <div className="bm-flex bm-items-center bm-gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="bm-rounded-md bm-p-1 hover:bm-bg-surface-3 disabled:bm-opacity-40">
              <ChevronLeft size={14} />
            </button>
            <span className="bm-tabular-nums">
              {page + 1}/{pages}
            </span>
            <button
              type="button"
              disabled={page >= pages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="bm-rounded-md bm-p-1 hover:bm-bg-surface-3 disabled:bm-opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
