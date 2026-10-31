import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldCheck,
  X,
  XCircle
} from "lucide-react"
import { ReactNode, useState } from "react"

import { cn } from "./cn"

type TTone = "info" | "success" | "warning" | "danger" | "neutral" | "secure"

interface CalloutProps {
  tone?: TTone
  title?: ReactNode
  children?: ReactNode
  icon?: ReactNode
  closable?: boolean
  action?: ReactNode
  className?: string
  compact?: boolean
  /** Vertical alignment of icon/action; compact callouts centre by default */
  align?: "start" | "center"
}

const STYLE: Record<TTone, { box: string; icon: string; Icon: typeof Info }> = {
  info: { box: "bm-bg-info-soft bm-border-info/25", icon: "bm-text-info", Icon: Info },
  success: {
    box: "bm-bg-success-soft bm-border-success/25",
    icon: "bm-text-success",
    Icon: CheckCircle2
  },
  warning: {
    box: "bm-bg-warning-soft bm-border-warning/30",
    icon: "bm-text-warning",
    Icon: AlertTriangle
  },
  danger: {
    box: "bm-bg-danger-soft bm-border-danger/25",
    icon: "bm-text-danger",
    Icon: XCircle
  },
  neutral: {
    box: "bm-bg-surface-2 bm-border-line",
    icon: "bm-text-fg-muted",
    Icon: Info
  },
  secure: {
    box: "bm-bg-success-soft bm-border-success/25",
    icon: "bm-text-success",
    Icon: ShieldCheck
  }
}

const Callout = ({
  tone = "info",
  title,
  children,
  icon,
  closable,
  action,
  className,
  compact,
  align
}: CalloutProps) => {
  const [closed, setClosed] = useState(false)
  if (closed) return null
  const s = STYLE[tone]
  const centered = (align ?? (compact ? "center" : "start")) === "center"
  return (
    <div
      role="status"
      className={cn(
        "bm-flex bm-gap-2.5 bm-rounded-xl bm-border",
        centered ? "bm-items-center" : "bm-items-start",
        compact ? "bm-px-3 bm-py-2" : "bm-px-3.5 bm-py-3",
        s.box,
        className
      )}>
      <span className={cn("bm-inline-flex bm-shrink-0", !centered && "bm-mt-px", s.icon)}>
        {icon ?? <s.Icon size={16} />}
      </span>
      <div className="bm-min-w-0 bm-flex-1 bm-text-[12.5px] bm-leading-snug bm-text-fg">
        {title && <div className="bm-font-semibold">{title}</div>}
        {children && (
          <div className={cn(title && "bm-mt-0.5 bm-text-fg-muted")}>{children}</div>
        )}
      </div>
      {action && <div className="bm-inline-flex bm-shrink-0 bm-items-center">{action}</div>}
      {closable && (
        <button
          type="button"
          onClick={() => setClosed(true)}
          className={cn(
            "-bm-mr-1 bm-shrink-0 bm-rounded-md bm-p-1 bm-text-fg-subtle hover:bm-bg-fg/5 hover:bm-text-fg",
            !centered && "-bm-mt-0.5"
          )}
          aria-label="Đóng">
          <X size={14} />
        </button>
      )}
    </div>
  )
}

export default Callout
