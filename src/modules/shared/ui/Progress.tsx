import { cn } from "./cn"

interface ProgressProps {
  value: number
  tone?: "brand" | "success" | "warning" | "danger" | "info"
  size?: "xs" | "sm" | "md"
  striped?: boolean
  label?: boolean
  className?: string
}

const TONE = {
  brand: "bm-bg-brand",
  success: "bm-bg-success",
  warning: "bm-bg-warning",
  danger: "bm-bg-danger",
  info: "bm-bg-info"
}

const Progress = ({
  value,
  tone = "brand",
  size = "sm",
  striped,
  label,
  className
}: ProgressProps) => {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={cn("bm-flex bm-items-center bm-gap-3", className)}>
      <div
        className={cn(
          "bm-relative bm-flex-1 bm-overflow-hidden bm-rounded-full bm-bg-surface-3",
          size === "xs" && "bm-h-1",
          size === "sm" && "bm-h-1.5",
          size === "md" && "bm-h-2.5"
        )}
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}>
        <div
          className={cn(
            "bm-h-full bm-rounded-full bm-transition-[width] bm-duration-500 bm-ease-out",
            TONE[tone],
            striped && "x-stripes bm-animate-stripe"
          )}
          style={{ width: `${v}%` }}
        />
      </div>
      {label && (
        <span className="bm-w-9 bm-shrink-0 bm-text-right bm-text-[11.5px] bm-font-semibold bm-tabular-nums bm-text-fg-muted">
          {v}%
        </span>
      )}
    </div>
  )
}

export default Progress
