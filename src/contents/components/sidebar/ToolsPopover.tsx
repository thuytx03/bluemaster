import { GripVertical, Pin, PinOff, Search } from "lucide-react"
import {
  DragEvent,
  MouseEvent,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import {
  normalizeForSearch,
  Tool,
  useToolCategories,
  useTools
} from "src/configs/tools.config"
import { cn, EmptyState, Input, Popover } from "src/modules/shared/ui"
import usePinnedTools from "src/stores/pinned-tools.store"

interface ToolsPopoverProps {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  placement?: "left-start" | "bottom-start" | "bottom-end" | "top-start"
}

const ToolTile = ({
  tool,
  pinned,
  onOpen,
  onTogglePin,
  draggable,
  dragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: {
  tool: Tool
  pinned: boolean
  onOpen: () => void
  onTogglePin: () => void
  draggable?: boolean
  dragging?: boolean
  onDragStart?: (e: DragEvent) => void
  onDragOver?: (e: DragEvent) => void
  onDrop?: (e: DragEvent) => void
  onDragEnd?: () => void
}) => {
  const { t } = useTranslation()
  const handleContext = (e: MouseEvent) => {
    e.preventDefault()
    onTogglePin()
  }
  return (
    <div
      className={cn(
        "bm-group/tile bm-relative bm-transition-opacity",
        dragging && "bm-opacity-40"
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}>
      <button
        type="button"
        onClick={onOpen}
        onContextMenu={handleContext}
        title={tool.description}
        className={cn(
          "bm-flex bm-w-full bm-flex-col bm-items-center bm-gap-1.5 bm-rounded-xl bm-px-1 bm-py-2.5 bm-text-center bm-transition-colors hover:bm-bg-surface-2",
          pinned && !draggable && "bm-bg-brand-soft/40",
          draggable && "bm-cursor-grab active:bm-cursor-grabbing"
        )}>
        <span
          className={cn(
            "bm-inline-flex bm-h-6 bm-w-6 bm-items-center bm-justify-center [&>svg]:bm-h-5 [&>svg]:bm-w-5",
            tool.color
          )}>
          {tool.icon}
        </span>
        <span className="bm-line-clamp-1 bm-w-full bm-text-[11.5px] bm-font-medium bm-text-fg">
          {tool.label}
        </span>
      </button>
      {draggable && (
        <span className="bm-pointer-events-none bm-absolute bm-left-1 bm-top-1 bm-text-fg-subtle bm-opacity-0 bm-transition-opacity group-hover/tile:bm-opacity-100">
          <GripVertical size={12} />
        </span>
      )}
      <button
        type="button"
        title={pinned ? t("unpin") : t("pin")}
        onClick={onTogglePin}
        className={cn(
          "bm-absolute bm-right-1 bm-top-1 bm-inline-flex bm-h-5 bm-w-5 bm-items-center bm-justify-center bm-rounded-md bm-bg-surface bm-text-fg-subtle bm-opacity-0 bm-shadow-card bm-transition-all hover:bm-text-brand-ink group-hover/tile:bm-opacity-100",
          pinned && "bm-text-brand-ink"
        )}>
        {pinned ? <PinOff size={11} /> : <Pin size={11} />}
      </button>
    </div>
  )
}

/* The "More" panel: pinned tools + every tool, Monica style. */
const ToolsPopover = ({
  open,
  onClose,
  anchorRef,
  placement = "left-start"
}: ToolsPopoverProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tools = useTools().filter((tl) => !tl.utility)
  const categories = useToolCategories()
  const { pinned, toggle, setPinned } = usePinnedTools()
  const close = useCallback(() => onClose(), [onClose])
  const [query, setQuery] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [order, setOrder] = useState<string[] | null>(null)

  // focus the search box without scrolling the panel
  useEffect(() => {
    if (open)
      setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 30)
  }, [open])

  const effectivePinned = order ?? pinned
  const onTileDragStart = (key: string) => (e: DragEvent) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", key)
    setDragKey(key)
    setOrder([...pinned])
  }
  const onTileDragOver = (overKey: string) => (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (!dragKey || dragKey === overKey) return
    setOrder((cur) => {
      const list = [...(cur ?? pinned)]
      const from = list.indexOf(dragKey)
      const to = list.indexOf(overKey)
      if (from === -1 || to === -1) return cur
      list.splice(from, 1)
      list.splice(to, 0, dragKey)
      return list
    })
  }
  const commitOrder = () => {
    if (order && order.join() !== pinned.join())
      setPinned(order as typeof pinned)
    setOrder(null)
    setDragKey(null)
  }

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const q = normalizeForSearch(query.trim())
  const visible = useMemo(
    () =>
      q
        ? tools.filter((tl) =>
            normalizeForSearch(`${tl.label} ${tl.description}`).includes(q)
          )
        : tools,
    [tools, q]
  )
  const grouped = categories
    .map((c) => ({
      ...c,
      tools: visible.filter((tl) => tl.category === c.key)
    }))
    .filter((c) => c.tools.length > 0)

  const pinnedTools = effectivePinned
    .map((k) => tools.find((tl) => tl.key === k))
    .filter((tl): tl is Tool => !!tl)

  return (
    <Popover
      open={open}
      onClose={close}
      anchorRef={anchorRef}
      placement={placement}
      offset={10}
      className="bm-rounded-2xl bm-p-4"
      matchWidth={false}>
      <div
        style={{ width: "min(360px, calc(100vw - 120px))" }}
        className="bm-flex bm-max-h-[70vh] bm-flex-col bm-gap-3">
        <Input
          ref={searchRef}
          size="sm"
          prefix={<Search size={13} />}
          placeholder={t("search_tools")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="bm-flex bm-min-h-0 bm-flex-col bm-gap-4 bm-overflow-y-auto bm-pr-1">
          {!q && (
            <section>
              <div className="bm-text-[14px] bm-font-semibold bm-text-fg">
                {t("pinned_tools")}
              </div>
              <div className="bm-text-[12px] bm-text-fg-muted">
                {t("pinned_tools_desc")}
              </div>
              <div className="bm-mt-2 bm-grid bm-grid-cols-4 bm-gap-1">
                {pinnedTools.map((tl) => (
                  <ToolTile
                    key={tl.key}
                    tool={tl}
                    pinned
                    draggable
                    dragging={dragKey === tl.key}
                    onDragStart={onTileDragStart(tl.key)}
                    onDragOver={onTileDragOver(tl.key)}
                    onDrop={(e) => {
                      e.preventDefault()
                      commitOrder()
                    }}
                    onDragEnd={commitOrder}
                    onOpen={() => {
                      navigate(tl.path)
                      close()
                    }}
                    onTogglePin={() => toggle(tl.key)}
                  />
                ))}
                {pinnedTools.length === 0 && (
                  <div className="bm-col-span-4 bm-rounded-xl bm-border bm-border-dashed bm-border-line bm-px-3 bm-py-4 bm-text-center bm-text-[12px] bm-text-fg-subtle">
                    {t("no_pinned_tools")}
                  </div>
                )}
              </div>
            </section>
          )}

          <section>
            {!q && (
              <>
                <div className="bm-text-[14px] bm-font-semibold bm-text-fg">
                  {t("all_tools")}
                </div>
                <div className="bm-text-[12px] bm-text-fg-muted">
                  {t("all_tools_desc")}
                </div>
              </>
            )}
            {grouped.length === 0 && (
              <EmptyState
                compact
                icon={<Search size={16} />}
                title={t("no_tools_found")}
              />
            )}
            {grouped.map((c) => (
              <div key={c.key} className="bm-mt-2">
                <div className="bm-mb-0.5 bm-px-1 bm-text-[10.5px] bm-font-semibold bm-uppercase bm-tracking-wider bm-text-fg-subtle">
                  {c.label}
                </div>
                <div className="bm-grid bm-grid-cols-4 bm-gap-1">
                  {c.tools.map((tl) => (
                    <ToolTile
                      key={tl.key}
                      tool={tl}
                      pinned={pinned.includes(tl.key)}
                      onOpen={() => {
                        navigate(tl.path)
                        close()
                      }}
                      onTogglePin={() => toggle(tl.key)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </Popover>
  )
}

export default ToolsPopover
