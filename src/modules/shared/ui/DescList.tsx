import { ReactNode } from "react"

import { cn } from "./cn"

export interface DescItem {
  label: ReactNode
  value: ReactNode
}

const DescList = ({
  items,
  className,
  labelWidth = 120
}: {
  items: DescItem[]
  className?: string
  labelWidth?: number
}) => (
  <dl className={cn("bm-divide-y bm-divide-line/80 bm-overflow-hidden bm-rounded-xl bm-border bm-border-line", className)}>
    {items.map((it, i) => (
      <div key={i} className="bm-flex bm-items-start bm-gap-3 bm-px-3 bm-py-2 bm-text-[12.5px] odd:bm-bg-surface-2/40">
        <dt className="bm-shrink-0 bm-text-fg-muted" style={{ width: labelWidth }}>
          {it.label}
        </dt>
        <dd className="bm-min-w-0 bm-flex-1 bm-text-fg">{it.value}</dd>
      </div>
    ))}
  </dl>
)

export default DescList
