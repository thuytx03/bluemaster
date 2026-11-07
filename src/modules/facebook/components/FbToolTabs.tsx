import { ReactNode } from "react"
import { useSearchParams } from "react-router-dom"

import { Segmented } from "src/modules/shared/ui"

export interface FbToolTab {
  key: string
  label: ReactNode
  icon?: ReactNode
  render: () => ReactNode
}

/**
 * Top-level tab switcher for pages that group several related tools
 * (e.g. Friends = list + received + sent requests). The active tab lives in
 * `?tab=` so the menu and old tool links can deep-link into a tab.
 */
export default function FbToolTabs({ tabs }: { tabs: FbToolTab[] }) {
  const [params, setParams] = useSearchParams()
  const active = tabs.find((tb) => tb.key === params.get("tab")) ?? tabs[0]

  return (
    <>
      <Segmented
        block
        size="sm"
        value={active.key}
        onChange={(key) => setParams({ tab: key }, { replace: true })}
        options={tabs.map((tb) => ({
          value: tb.key,
          label: tb.label,
          icon: tb.icon
        }))}
      />
      {/* keyed so each tool mounts fresh and keeps its own loading/cache logic */}
      <div key={active.key} className="bm-flex bm-flex-col bm-gap-3">
        {active.render()}
      </div>
    </>
  )
}
