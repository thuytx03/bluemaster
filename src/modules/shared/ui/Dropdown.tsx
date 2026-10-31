import { ReactNode, useCallback, useRef, useState } from "react"

import { cn } from "./cn"
import Popover, { TPlacement } from "./Popover"

export interface DropdownItem {
  key: string
  label: ReactNode
  icon?: ReactNode
  description?: ReactNode
  danger?: boolean
  disabled?: boolean
  onClick?: () => void
}

interface DropdownProps {
  items: DropdownItem[]
  children: ReactNode
  placement?: TPlacement
  className?: string
  minWidth?: number
}

const Dropdown = ({
  items,
  children,
  placement = "bottom-end",
  className,
  minWidth = 180
}: DropdownProps) => {
  const ref = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  return (
    <>
      <span
        ref={ref}
        onClick={() => setOpen((o) => !o)}
        className={cn("bm-inline-flex", className)}>
        {children}
      </span>
      <Popover open={open} onClose={close} anchorRef={ref} placement={placement} className="bm-p-1.5">
        <div role="menu" style={{ minWidth }}>
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              onClick={() => {
                if (it.disabled) return
                it.onClick?.()
                close()
              }}
              className={cn(
                "bm-flex bm-w-full bm-items-center bm-gap-2.5 bm-rounded-lg bm-px-2.5 bm-py-2 bm-text-left bm-text-[13px] bm-text-fg bm-transition-colors hover:bm-bg-surface-2 disabled:bm-cursor-not-allowed disabled:bm-opacity-50",
                it.danger && "bm-text-danger hover:bm-bg-danger-soft"
              )}>
              {it.icon && <span className="bm-shrink-0 bm-text-fg-muted">{it.icon}</span>}
              <span className="bm-min-w-0 bm-flex-1">
                <span className="bm-block bm-truncate">{it.label}</span>
                {it.description && (
                  <span className="bm-block bm-truncate bm-text-[11.5px] bm-text-fg-muted">
                    {it.description}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </Popover>
    </>
  )
}

export default Dropdown
