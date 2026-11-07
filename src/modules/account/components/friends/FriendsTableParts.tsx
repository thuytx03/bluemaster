import type { TFunction } from "i18next"
import { Loader2, MoreHorizontal, Square } from "lucide-react"
import { ReactNode } from "react"

import type { FriendsBulkState } from "src/modules/facebook/types/bulk.types"
import { Avatar, cn, Dropdown, IconButton } from "src/modules/shared/ui"
import type { DropdownItem } from "src/modules/shared/ui"

export type LoadState = "idle" | "loading" | "success" | "error"
export type LoadFn = (options: {
  cursor: string | null
  accumulate?: boolean
  forceRefresh?: boolean
}) => Promise<void>

export const addToSet = (prev: Set<string>, id: string) => new Set(prev).add(id)
export const removeFromSet = (prev: Set<string>, id: string) => {
  const s = new Set(prev)
  s.delete(id)
  return s
}

/** Gender label used by the tables; `fallback` differs between tabs in the source. */
export function genderLabel(t: TFunction, gender: string, fallback: string) {
  if (gender === "Male") return t("friends_shared_gender_male")
  if (gender === "Female") return t("friends_shared_gender_female")
  if (gender === "Other") return t("friends_shared_gender_other")
  return fallback
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="bm-flex bm-flex-col bm-gap-2.5 bm-rounded-xl bm-border bm-border-line bm-bg-surface-2/40 bm-p-2.5">
      {children}
    </div>
  )
}

/** Running bulk progress chip with a stop button (source: inline toolbar block). */
export function BulkProgress({
  label,
  bulk,
  onStop,
  stopLabel
}: {
  label: ReactNode
  bulk: FriendsBulkState
  onStop: () => void
  stopLabel: string
}) {
  return (
    <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2 bm-rounded-lg bm-border bm-border-line bm-bg-surface bm-px-2.5 bm-py-1 bm-text-[12px] bm-text-fg-muted">
      <Loader2
        size={14}
        className="bm-shrink-0 bm-animate-spin bm-text-brand"
      />
      <span className="bm-font-medium">{label}</span>
      <span className="bm-font-mono">
        {bulk.current}/{bulk.total}
      </span>
      <span className="bm-font-medium bm-text-success">✓{bulk.success}</span>
      {bulk.fail > 0 && (
        <span className="bm-font-medium bm-text-danger">✗{bulk.fail}</span>
      )}
      <IconButton
        size="xs"
        variant="ghost"
        label={stopLabel}
        onClick={onStop}
        className="bm-ml-auto bm-h-6 bm-w-6 hover:bm-bg-danger-soft hover:bm-text-danger">
        <Square size={12} />
      </IconButton>
    </div>
  )
}

export type ActionTone = "danger" | "success" | "warning" | "indigo"

const TONE: Record<ActionTone, string> = {
  danger:
    "bm-border-danger/25 bm-bg-danger-soft bm-text-danger hover:bm-bg-danger/15",
  success:
    "bm-border-success/25 bm-bg-success-soft bm-text-success hover:bm-bg-success/15",
  warning:
    "bm-border-warning/30 bm-bg-warning-soft bm-text-warning hover:bm-bg-warning/15",
  indigo:
    "bm-border-indigo-500/25 bm-bg-indigo-500/10 bm-text-indigo-600 hover:bm-bg-indigo-500/20 dark:bm-text-indigo-400"
}

/** Small row action button: tinted icon button with a spinner while busy. */
export function RowAction({
  label,
  tone,
  icon,
  busy,
  muted,
  disabled,
  onClick
}: {
  label: string
  tone: ActionTone
  icon: ReactNode
  busy?: boolean
  /** Greyed-out look used by the source for rows that were already unfriended. */
  muted?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <IconButton
      size="xs"
      variant="outline"
      label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "bm-border",
        muted
          ? "bm-border-line bm-bg-surface-2 bm-text-fg-subtle hover:bm-bg-surface-2"
          : TONE[tone]
      )}>
      {busy ? <Loader2 size={13} className="bm-animate-spin" /> : icon}
    </IconButton>
  )
}

/** Avatar + profile link + uid cell. */
export function UserCell({
  name,
  url,
  subId,
  pic
}: {
  name: string
  url: string
  subId: string
  pic: string
}) {
  return (
    <div className="bm-flex bm-items-center bm-gap-2">
      <Avatar src={pic} name={name} size={30} rounded="xl" />
      <div className="bm-flex bm-min-w-0 bm-flex-col">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="bm-max-w-[160px] bm-truncate bm-font-semibold bm-text-brand-ink hover:bm-underline">
          {name}
        </a>
        <span className="bm-mt-0.5 bm-font-mono bm-text-[10px] bm-tracking-tight bm-text-fg-subtle">
          {subId}
        </span>
      </div>
    </div>
  )
}

export const TH =
  "bm-px-2 bm-py-2 bm-text-left bm-text-[11px] bm-font-semibold bm-text-fg-muted bm-whitespace-nowrap"
export const TD = "bm-px-2 bm-py-1.5 bm-align-middle"

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="bm-overflow-x-auto bm-rounded-xl bm-border bm-border-line bm-bg-surface">
      <table className="bm-w-full bm-border-collapse bm-text-[12px] bm-text-fg">
        {children}
      </table>
    </div>
  )
}

export function rowClass(selected: boolean) {
  return cn(
    "bm-border-t bm-border-line bm-transition-colors hover:bm-bg-surface-2/60",
    selected && "bm-bg-brand-soft/40 hover:bm-bg-brand-soft/60"
  )
}

/**
 * Overflow menu for secondary row actions: labelled items instead of a row of
 * look-alike icon buttons; destructive items are flagged `danger` / `divider`.
 */
export function FriendRowMenu({
  items,
  moreLabel,
  busy
}: {
  items: DropdownItem[]
  moreLabel: string
  busy?: boolean
}) {
  return (
    <Dropdown items={items} placement="bottom-end" minWidth={170}>
      <IconButton size="xs" variant="outline" label={moreLabel} disabled={busy}>
        {busy ? (
          <Loader2 size={13} className="bm-animate-spin" />
        ) : (
          <MoreHorizontal size={14} />
        )}
      </IconButton>
    </Dropdown>
  )
}
