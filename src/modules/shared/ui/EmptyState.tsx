import { ReactNode } from "react"

import { cn } from "./cn"

interface EmptyStateProps {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
  compact?: boolean
}

const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
  compact
}: EmptyStateProps) => (
  <div
    className={cn(
      "bm-flex bm-flex-col bm-items-center bm-justify-center bm-text-center",
      compact ? "bm-px-4 bm-py-6" : "bm-px-6 bm-py-12",
      className
    )}>
    {icon && (
      <div className="bm-mb-3 bm-inline-flex bm-h-12 bm-w-12 bm-items-center bm-justify-center bm-rounded-2xl bm-bg-surface-2 bm-text-fg-subtle x-dots">
        {icon}
      </div>
    )}
    <div className="bm-text-[13.5px] bm-font-semibold bm-text-fg">{title}</div>
    {description && (
      <div className="bm-mt-1 bm-max-w-xs bm-text-[12px] bm-leading-relaxed bm-text-fg-muted">
        {description}
      </div>
    )}
    {action && <div className="bm-mt-4">{action}</div>}
  </div>
)

export default EmptyState
