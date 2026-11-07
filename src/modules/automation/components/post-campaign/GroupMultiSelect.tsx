import { ChevronDown, Search, X } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { normalizeForSearch } from "src/configs/tools.config"
import type { PostGroup } from "src/modules/automation/types/post-campaign.types"
import {
  Badge,
  Button,
  Checkbox,
  cn,
  Input,
  Popover
} from "src/modules/shared/ui"

interface Props {
  groups: PostGroup[]
  selected: PostGroup[]
  onChange: (groups: PostGroup[]) => void
  placeholder: string
  searchPlaceholder: string
  /** Chips shown before collapsing into "+N" */
  maxCount?: number
}

/** Searchable multi-select of groups (replaces shadcn MultiSelect of the source). */
export function GroupMultiSelect({
  groups,
  selected,
  onChange,
  placeholder,
  searchPlaceholder,
  maxCount = 3
}: Props) {
  const { t } = useTranslation()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const selectedIds = useMemo(
    () => new Set(selected.map((g) => g.groupId)),
    [selected]
  )
  const filtered = useMemo(() => {
    const q = normalizeForSearch(search.trim())
    return q
      ? groups.filter(
          (g) =>
            normalizeForSearch(g.groupName).includes(q) ||
            g.groupId.includes(search.trim())
        )
      : groups
  }, [groups, search])

  const toggle = (g: PostGroup) =>
    onChange(
      selectedIds.has(g.groupId)
        ? selected.filter((x) => x.groupId !== g.groupId)
        : [...selected, g]
    )

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="bm-flex bm-min-h-9 bm-w-full bm-items-center bm-gap-1.5 bm-rounded-lg bm-border bm-border-line-strong/80 bm-bg-surface bm-px-2 bm-py-1 bm-text-left bm-text-[12.5px] hover:bm-border-line-strong">
        <div className="bm-flex bm-min-w-0 bm-flex-1 bm-flex-wrap bm-gap-1">
          {selected.length === 0 && (
            <span className="bm-text-fg-subtle">{placeholder}</span>
          )}
          {selected.slice(0, maxCount).map((g) => (
            <Badge
              key={g.groupId}
              tone="brand"
              size="sm"
              className="bm-max-w-[140px]">
              <span className="bm-truncate">{g.groupName}</span>
              <X
                size={11}
                className="bm-shrink-0 bm-cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  toggle(g)
                }}
              />
            </Badge>
          ))}
          {selected.length > maxCount && (
            <Badge tone="neutral" size="sm">
              +{selected.length - maxCount}
            </Badge>
          )}
        </div>
        <ChevronDown size={14} className="bm-shrink-0 bm-text-fg-muted" />
      </button>
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        matchWidth
        className="bm-p-2">
        <div className="bm-flex bm-flex-col bm-gap-2">
          <Input
            size="sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<Search size={12} />}
            placeholder={searchPlaceholder}
          />
          <div className="bm-max-h-[260px] bm-overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="bm-py-4 bm-text-center bm-text-[12.5px] bm-italic bm-text-fg-muted">
                {t("campaign_manager_no_groups_found")}
              </p>
            ) : (
              filtered.map((g) => (
                <div
                  key={g.groupId}
                  onClick={() => toggle(g)}
                  className={cn(
                    "bm-flex bm-cursor-pointer bm-items-center bm-gap-2 bm-rounded-lg bm-px-2 bm-py-1.5 hover:bm-bg-surface-2",
                    selectedIds.has(g.groupId) && "bm-bg-brand-soft/60"
                  )}>
                  <Checkbox
                    size="sm"
                    checked={selectedIds.has(g.groupId)}
                    onChange={() => toggle(g)}
                  />
                  <span className="bm-truncate bm-text-[12.5px] bm-text-fg">
                    {g.groupName}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="bm-flex bm-justify-between bm-gap-2 bm-border-t bm-border-line bm-pt-2">
            <Button
              variant="ghost"
              size="xs"
              onClick={() =>
                onChange(selected.length === groups.length ? [] : [...groups])
              }>
              {selected.length === groups.length && groups.length > 0
                ? t("campaign_manager_remove_all")
                : t("campaign_manager_select_all")}
            </Button>
            <Button variant="primary" size="xs" onClick={() => setOpen(false)}>
              {t("campaign_manager_done")}
            </Button>
          </div>
        </div>
      </Popover>
    </>
  )
}
