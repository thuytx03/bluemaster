import { ReactNode } from "react"

import { cn } from "./cn"

const Kbd = ({ children, className }: { children: ReactNode; className?: string }) => (
  <kbd
    className={cn(
      "bm-inline-flex bm-h-5 bm-items-center bm-rounded-md bm-border bm-border-line-strong bm-bg-surface-2 bm-px-1.5 bm-font-mono bm-text-[11px] bm-text-fg-muted bm-shadow-[0_1px_0_hsl(var(--x-border-strong))]",
      className
    )}>
    {children}
  </kbd>
)

export default Kbd
