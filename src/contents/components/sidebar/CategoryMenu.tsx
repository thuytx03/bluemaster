import { Pin, PinOff } from "lucide-react"
import { RefObject } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import type { Tool, ToolCategory } from "src/configs/tools.config"
import { cn, Popover } from "src/modules/shared/ui"
import usePinnedTools from "src/stores/pinned-tools.store"

interface CategoryMenuProps {
  category: ToolCategory | null
  tools: Tool[]
  activeKey?: string
  anchorRef: RefObject<HTMLElement | null>
  onClose: () => void
}

/**
 * Fly-out submenu of a rail category: every tool of that group as a labelled
 * row (icon, name, description) with a pin toggle, so the rail can show a
 * handful of groups instead of one icon per tool.
 */
export default function CategoryMenu({
  category,
  tools,
  activeKey,
  anchorRef,
  onClose
}: CategoryMenuProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pinned, toggle } = usePinnedTools()

  return (
    <Popover
      open={!!category}
      onClose={onClose}
      anchorRef={anchorRef}
      placement="left-start"
      offset={10}
      matchWidth={false}
      className="bm-rounded-2xl bm-p-2">
      {category && (
        <div
          role="menu"
          style={{ width: "min(300px, calc(100vw - 120px))" }}
          className="bm-flex bm-flex-col">
          <div className="bm-px-2 bm-pb-1.5 bm-pt-1">
            <div className="bm-text-[13.5px] bm-font-semibold bm-text-fg">
              {category.label}
            </div>
            {category.description && (
              <div className="bm-text-[11.5px] bm-text-fg-muted">
                {category.description}
              </div>
            )}
          </div>
          {tools.map((tl) => {
            const isPinned = pinned.includes(tl.key)
            return (
              <div key={tl.key} className="bm-group/row bm-relative">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    navigate(tl.path)
                    onClose()
                  }}
                  className={cn(
                    "bm-flex bm-w-full bm-items-center bm-gap-2.5 bm-rounded-lg bm-px-2 bm-py-2 bm-pr-9 bm-text-left bm-transition-colors hover:bm-bg-surface-2",
                    activeKey === tl.key && "bm-bg-brand-soft/50"
                  )}>
                  <span
                    className={cn(
                      "bm-inline-flex bm-h-8 bm-w-8 bm-shrink-0 bm-items-center bm-justify-center bm-rounded-lg bm-bg-surface-2 [&>svg]:bm-h-4 [&>svg]:bm-w-4",
                      tl.color
                    )}>
                    {tl.icon}
                  </span>
                  <span className="bm-min-w-0 bm-flex-1">
                    <span className="bm-flex bm-items-center bm-gap-1.5">
                      <span className="bm-truncate bm-text-[13px] bm-font-medium bm-text-fg">
                        {tl.label}
                      </span>
                      {tl.isNew && (
                        <span className="bm-shrink-0 bm-rounded bm-bg-gradient-to-r bm-from-rose-500 bm-to-orange-400 bm-px-1 bm-text-[8px] bm-font-bold bm-uppercase bm-leading-[13px] bm-text-white">
                          new
                        </span>
                      )}
                    </span>
                    <span className="bm-block bm-truncate bm-text-[11.5px] bm-text-fg-muted">
                      {tl.description}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  title={isPinned ? t("unpin") : t("pin")}
                  aria-label={isPinned ? t("unpin") : t("pin")}
                  onClick={() => toggle(tl.key)}
                  className={cn(
                    "bm-absolute bm-right-2 bm-top-1/2 bm-inline-flex bm-h-6 bm-w-6 -bm-translate-y-1/2 bm-items-center bm-justify-center bm-rounded-md bm-text-fg-subtle bm-transition-all hover:bm-bg-surface-3 hover:bm-text-brand-ink",
                    isPinned
                      ? "bm-text-brand-ink"
                      : "bm-opacity-0 group-hover/row:bm-opacity-100"
                  )}>
                  {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </Popover>
  )
}
