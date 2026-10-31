import { ArrowRight, CalendarRange, X } from "lucide-react"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"

import { TDateRange } from "src/modules/download/types/download.types"
import { cn } from "src/modules/shared/ui"

interface DateRangeFieldProps {
  value: TDateRange | null
  onChange: (value: TDateRange | null) => void
  disabled?: boolean
  className?: string
}

const today = () => dayjs().format("YYYY-MM-DD")

const inputClass =
  "bm-h-full bm-min-w-0 bm-flex-1 bm-bg-transparent bm-px-2 bm-text-[13px] bm-tabular-nums bm-text-fg focus:bm-outline-none disabled:bm-cursor-not-allowed disabled:bm-text-fg-subtle [&::-webkit-calendar-picker-indicator]:bm-cursor-pointer [&::-webkit-calendar-picker-indicator]:bm-opacity-50 hover:[&::-webkit-calendar-picker-indicator]:bm-opacity-100"

/** One grouped control with two native date inputs (from → to) and a clear button. */
const DateRangeField = ({ value, onChange, disabled, className }: DateRangeFieldProps) => {
  const { t } = useTranslation()
  const from = value?.[0] ?? ""
  const to = value?.[1] ?? ""

  const update = (nextFrom: string, nextTo: string) => {
    if (!nextFrom && !nextTo) return onChange(null)
    onChange([nextFrom, nextTo])
  }

  return (
    <div
      className={cn(
        "bm-flex bm-h-9 bm-items-center bm-overflow-hidden bm-rounded-lg bm-border bm-border-line-strong/80 bm-bg-surface bm-transition-[border-color,box-shadow] bm-duration-150 hover:bm-border-line-strong focus-within:bm-border-brand focus-within:bm-shadow-glow",
        disabled && "bm-cursor-not-allowed bm-bg-surface-2 hover:bm-border-line-strong/80",
        className
      )}>
      <span className="bm-flex bm-h-full bm-shrink-0 bm-items-center bm-border-r bm-border-line bm-bg-surface-2 bm-px-2.5 bm-text-fg-muted">
        <CalendarRange size={13} />
      </span>
      <input
        type="date"
        value={from}
        max={to || today()}
        disabled={disabled}
        aria-label={t("date_from")}
        onChange={(e) => update(e.target.value, to)}
        className={inputClass}
      />
      <span className="bm-shrink-0 bm-text-fg-subtle">
        <ArrowRight size={12} />
      </span>
      <input
        type="date"
        value={to}
        min={from || undefined}
        max={today()}
        disabled={disabled}
        aria-label={t("date_to")}
        onChange={(e) => update(from, e.target.value)}
        className={inputClass}
      />
      <button
        type="button"
        aria-label={t("clear")}
        title={t("clear")}
        disabled={disabled || (!from && !to)}
        onClick={() => onChange(null)}
        className="bm-flex bm-h-full bm-shrink-0 bm-items-center bm-border-l bm-border-line bm-px-2 bm-text-fg-subtle bm-transition-colors hover:bm-bg-surface-2 hover:bm-text-fg disabled:bm-invisible">
        <X size={12} />
      </button>
    </div>
  )
}

export default DateRangeField
