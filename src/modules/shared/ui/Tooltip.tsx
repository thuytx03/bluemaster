import { ReactNode, useCallback, useRef, useState } from "react"

import { cn } from "./cn"
import Popover, { TPlacement } from "./Popover"

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  placement?: TPlacement
  className?: string
  delay?: number
}

const Tooltip = ({
  content,
  children,
  placement = "top-start",
  className,
  delay = 120
}: TooltipProps) => {
  const ref = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const close = useCallback(() => setOpen(false), [])

  const show = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(true), delay)
  }
  const hide = () => {
    window.clearTimeout(timer.current)
    setOpen(false)
  }

  if (!content) return <>{children}</>

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className={cn("bm-inline-flex", className)}>
        {children}
      </span>
      <Popover
        open={open}
        onClose={close}
        anchorRef={ref}
        placement={placement}
        closeOnOutside={false}
        offset={6}
        className="bm-max-w-[260px] bm-rounded-lg bm-border-fg/10 bm-bg-fg bm-px-2.5 bm-py-1.5 bm-text-[11.5px] bm-leading-snug bm-text-app bm-shadow-pop dark:bm-bg-surface-3 dark:bm-text-fg">
        {content}
      </Popover>
    </>
  )
}

export default Tooltip
