import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Button, cn, IconButton, Select } from "src/modules/shared/ui"

interface TableFacebookPaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
}

/** Ported from xthuy-social `common/components/TableFacebookPagination`. */
export function TableFacebookPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50]
}: TableFacebookPaginationProps) {
  const { t } = useTranslation()
  const pageRange = useMemo((): (number | "ellipsis")[] => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    const left = Math.max(2, currentPage - 1)
    const right = Math.min(totalPages - 1, currentPage + 1)
    const pages: (number | "ellipsis")[] = [1]
    if (left > 2) pages.push("ellipsis")
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push("ellipsis")
    pages.push(totalPages)
    return pages
  }, [totalPages, currentPage])

  return (
    <div className="bm-mt-3 bm-flex bm-flex-wrap bm-items-center bm-justify-between bm-gap-3 bm-rounded-lg bm-border bm-border-line bm-bg-surface-2/50 bm-p-2.5 bm-text-[12px]">
      <div className="bm-font-medium bm-text-fg-muted">
        {t("shared_pagination_total", { count: totalItems })}
      </div>
      <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-3">
        <div className="bm-flex bm-items-center bm-gap-1">
          <IconButton
            size="sm"
            variant="outline"
            label="prev"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}>
            <ChevronLeft size={14} />
          </IconButton>
          {pageRange.map((item, idx) =>
            item === "ellipsis" ? (
              <span
                key={`e-${idx}`}
                className="bm-select-none bm-px-1 bm-text-fg-subtle">
                …
              </span>
            ) : (
              <Button
                key={item}
                size="xs"
                variant={currentPage === item ? "primary" : "outline"}
                className={cn("bm-min-w-[28px] bm-font-semibold")}
                onClick={() => onPageChange(item)}>
                {item}
              </Button>
            )
          )}
          <IconButton
            size="sm"
            variant="outline"
            label="next"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}>
            <ChevronRight size={14} />
          </IconButton>
        </div>
        <Select<number>
          size="sm"
          className="bm-w-[110px]"
          value={pageSize}
          onChange={onPageSizeChange}
          options={pageSizeOptions.map((size) => ({
            value: size,
            label: t("shared_pagination_rows_per_page", { size })
          }))}
        />
      </div>
    </div>
  )
}
