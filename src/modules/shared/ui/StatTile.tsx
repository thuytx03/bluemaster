import { ReactNode } from "react"

import { cn } from "./cn"

interface StatTileProps {
  label: ReactNode
  value: ReactNode
  icon?: ReactNode
  hint?: ReactNode
  tone?: "default" | "brand" | "success" | "warning" | "danger" | "info"
  className?: string
  size?: "sm" | "md"
}

const TONE = {
  default: "bm-text-fg",
  brand: "bm-text-brand-ink",
  success: "bm-text-success",
  warning: "bm-text-warning",
  danger: "bm-text-danger",
  info: "bm-text-info"
}

const ICON_BG = {
  default: "bm-bg-surface-2 bm-text-fg-muted",
  brand: "bm-bg-brand-soft bm-text-brand-ink",
  success: "bm-bg-success-soft bm-text-success",
  warning: "bm-bg-warning-soft bm-text-warning",
  danger: "bm-bg-danger-soft bm-text-danger",
  info: "bm-bg-info-soft bm-text-info"
}

const StatTile = ({
  label,
  value,
  icon,
  hint,
  tone = "default",
  className,
  size = "md"
}: StatTileProps) => (
  <div
    className={cn(
      "bm-flex bm-items-center bm-gap-3 bm-rounded-xl2 bm-border bm-border-line bm-bg-surface bm-shadow-card",
      size === "sm" ? "bm-p-2.5" : "bm-p-3.5",
      className
    )}>
    {icon && (
      <span
        className={cn(
          "bm-inline-flex bm-shrink-0 bm-items-center bm-justify-center bm-rounded-xl",
          size === "sm" ? "bm-h-8 bm-w-8" : "bm-h-10 bm-w-10",
          ICON_BG[tone]
        )}>
        {icon}
      </span>
    )}
    <div className="bm-min-w-0 bm-flex-1">
      <div className="bm-truncate bm-text-[11px] bm-font-medium bm-uppercase bm-tracking-wider bm-text-fg-subtle">
        {label}
      </div>
      <div
        className={cn(
          "bm-truncate bm-font-bold bm-tabular-nums bm-leading-tight",
          size === "sm" ? "bm-text-[17px]" : "bm-text-[21px]",
          TONE[tone]
        )}>
        {value}
      </div>
      {hint && <div className="bm-truncate bm-text-[11px] bm-text-fg-muted">{hint}</div>}
    </div>
  </div>
)

export default StatTile
