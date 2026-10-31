import { HTMLAttributes, ReactNode } from "react"

import { cn } from "./cn"

export interface SurfaceProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode
  description?: ReactNode
  icon?: ReactNode
  extra?: ReactNode
  padding?: "none" | "sm" | "md" | "lg"
  tone?: "default" | "muted" | "brand" | "success" | "warning" | "danger" | "info"
  bodyClassName?: string
  interactive?: boolean
}

const TONE: Record<NonNullable<SurfaceProps["tone"]>, string> = {
  default: "bm-bg-surface bm-border-line",
  muted: "bm-bg-surface-2/60 bm-border-line",
  brand: "bm-bg-brand-soft/60 bm-border-brand/25",
  success: "bm-bg-success-soft bm-border-success/25",
  warning: "bm-bg-warning-soft bm-border-warning/30",
  danger: "bm-bg-danger-soft bm-border-danger/25",
  info: "bm-bg-info-soft bm-border-info/25"
}

const PAD = { none: "", sm: "bm-p-3", md: "bm-p-4", lg: "bm-p-5" }

const Surface = ({
  title,
  description,
  icon,
  extra,
  padding = "md",
  tone = "default",
  className,
  bodyClassName,
  interactive,
  children,
  ...rest
}: SurfaceProps) => (
  <div
    className={cn(
      "bm-rounded-xl2 bm-border bm-shadow-card",
      TONE[tone],
      interactive &&
        "bm-transition-all bm-duration-150 hover:bm-border-line-strong hover:bm-shadow-pop/40",
      className
    )}
    {...rest}>
    {(title || extra) && (
      <div
        className={cn(
          "bm-flex bm-items-start bm-justify-between bm-gap-3 bm-border-b bm-border-line/80",
          padding === "none" ? "bm-px-4 bm-py-3" : "bm-px-4 bm-py-3"
        )}>
        <div className="bm-flex bm-min-w-0 bm-items-center bm-gap-2.5">
          {icon && (
            <span className="bm-inline-flex bm-h-7 bm-w-7 bm-shrink-0 bm-items-center bm-justify-center bm-rounded-lg bm-bg-surface-2 bm-text-fg-muted">
              {icon}
            </span>
          )}
          <div className="bm-min-w-0">
            <div className="bm-truncate bm-text-[13px] bm-font-semibold bm-text-fg">
              {title}
            </div>
            {description && (
              <div className="bm-text-[11.5px] bm-text-fg-muted">{description}</div>
            )}
          </div>
        </div>
        {extra && <div className="bm-flex bm-shrink-0 bm-items-center bm-gap-1.5">{extra}</div>}
      </div>
    )}
    <div className={cn(PAD[padding], bodyClassName)}>{children}</div>
  </div>
)

export const SectionLabel = ({
  children,
  className,
  hint
}: {
  children: ReactNode
  className?: string
  hint?: ReactNode
}) => (
  <div className={cn("bm-mb-1.5 bm-flex bm-items-baseline bm-justify-between bm-gap-2", className)}>
    <span className="bm-text-[11px] bm-font-semibold bm-uppercase bm-tracking-wider bm-text-fg-muted">
      {children}
    </span>
    {hint && <span className="bm-text-[11px] bm-text-fg-subtle">{hint}</span>}
  </div>
)

export default Surface
