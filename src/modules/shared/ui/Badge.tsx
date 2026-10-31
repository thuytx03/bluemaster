import { HTMLAttributes, ReactNode } from "react"

import { cn } from "./cn"

export type TBadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "outline"
  | "violet"
  | "pink"
  | "cyan"
  | "amber"
  | "lime"

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: TBadgeTone
  size?: "xs" | "sm" | "md"
  dot?: boolean
  icon?: ReactNode
  pulse?: boolean
}

const TONE: Record<TBadgeTone, string> = {
  neutral: "bm-bg-surface-2 bm-text-fg-muted",
  brand: "bm-bg-brand-soft bm-text-brand-ink",
  success: "bm-bg-success-soft bm-text-success",
  warning: "bm-bg-warning-soft bm-text-warning",
  danger: "bm-bg-danger-soft bm-text-danger",
  info: "bm-bg-info-soft bm-text-info",
  outline: "bm-bg-transparent bm-text-fg-muted bm-border bm-border-line-strong",
  violet: "bm-bg-violet-50 bm-text-violet-700 dark:bm-bg-violet-500/15 dark:bm-text-violet-300",
  pink: "bm-bg-pink-50 bm-text-pink-700 dark:bm-bg-pink-500/15 dark:bm-text-pink-300",
  cyan: "bm-bg-cyan-50 bm-text-cyan-700 dark:bm-bg-cyan-500/15 dark:bm-text-cyan-300",
  amber: "bm-bg-amber-50 bm-text-amber-700 dark:bm-bg-amber-500/15 dark:bm-text-amber-300",
  lime: "bm-bg-lime-50 bm-text-lime-700 dark:bm-bg-lime-500/15 dark:bm-text-lime-300"
}

const DOT: Record<TBadgeTone, string> = {
  neutral: "bm-bg-fg-subtle",
  brand: "bm-bg-brand",
  success: "bm-bg-success",
  warning: "bm-bg-warning",
  danger: "bm-bg-danger",
  info: "bm-bg-info",
  outline: "bm-bg-fg-subtle",
  violet: "bm-bg-violet-500",
  pink: "bm-bg-pink-500",
  cyan: "bm-bg-cyan-500",
  amber: "bm-bg-amber-500",
  lime: "bm-bg-lime-500"
}

const Badge = ({
  tone = "neutral",
  size = "sm",
  dot,
  icon,
  pulse,
  className,
  children,
  ...rest
}: BadgeProps) => (
  <span
    className={cn(
      "bm-inline-flex bm-shrink-0 bm-items-center bm-gap-1.5 bm-whitespace-nowrap bm-rounded-lg bm-font-medium",
      size === "xs" && "bm-h-[18px] bm-px-1.5 bm-text-[10px]",
      size === "sm" && "bm-h-[22px] bm-px-2 bm-text-[11px]",
      size === "md" && "bm-h-7 bm-px-2.5 bm-text-[12px]",
      TONE[tone],
      className
    )}
    {...rest}>
    {dot && (
      <span className="bm-relative bm-inline-flex bm-h-1.5 bm-w-1.5">
        {pulse && (
          <span
            className={cn(
              "bm-absolute bm-inline-flex bm-h-full bm-w-full bm-animate-ping bm-rounded-full bm-opacity-60",
              DOT[tone]
            )}
          />
        )}
        <span className={cn("bm-relative bm-inline-flex bm-h-1.5 bm-w-1.5 bm-rounded-full", DOT[tone])} />
      </span>
    )}
    {icon}
    {children}
  </span>
)

export default Badge
