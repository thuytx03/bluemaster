import { ReactNode, useState } from "react"

import { cn } from "./cn"

export interface TabItem {
  key: string
  label: ReactNode
  icon?: ReactNode
  content: ReactNode
  badge?: ReactNode
}

interface TabsProps {
  items: TabItem[]
  defaultActiveKey?: string
  activeKey?: string
  onChange?: (key: string) => void
  variant?: "pills" | "underline"
  className?: string
  contentClassName?: string
}

const Tabs = ({
  items,
  defaultActiveKey,
  activeKey,
  onChange,
  variant = "pills",
  className,
  contentClassName
}: TabsProps) => {
  const [inner, setInner] = useState(defaultActiveKey ?? items[0]?.key)
  const current = activeKey ?? inner
  const set = (k: string) => {
    setInner(k)
    onChange?.(k)
  }
  const active = items.find((i) => i.key === current) ?? items[0]

  return (
    <div className={cn("bm-flex bm-flex-col bm-gap-3", className)}>
      <div
        role="tablist"
        className={cn(
          variant === "pills"
            ? "bm-inline-flex bm-w-fit bm-max-w-full bm-items-center bm-gap-0.5 bm-overflow-x-auto bm-rounded-lg bm-bg-surface-2 bm-p-0.5 x-no-scrollbar"
            : "bm-flex bm-items-center bm-gap-1 bm-border-b bm-border-line"
        )}>
        {items.map((it) => {
          const isActive = it.key === active?.key
          return (
            <button
              key={it.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => set(it.key)}
              className={cn(
                "bm-inline-flex bm-items-center bm-gap-1.5 bm-whitespace-nowrap bm-font-medium bm-transition-all bm-duration-150",
                variant === "pills"
                  ? cn(
                      "bm-h-8 bm-rounded-lg bm-px-3 bm-text-[12.5px] bm-text-fg-muted hover:bm-text-fg",
                      isActive && "bm-bg-surface bm-text-fg bm-shadow-card"
                    )
                  : cn(
                      "-bm-mb-px bm-border-b-2 bm-border-transparent bm-px-3 bm-py-2 bm-text-[13px] bm-text-fg-muted hover:bm-text-fg",
                      isActive && "bm-border-brand bm-text-brand-ink"
                    )
              )}>
              {it.icon}
              {it.label}
              {it.badge}
            </button>
          )
        })}
      </div>
      <div key={active?.key} className={cn("bm-animate-fade-in", contentClassName)}>
        {active?.content}
      </div>
    </div>
  )
}

export default Tabs
