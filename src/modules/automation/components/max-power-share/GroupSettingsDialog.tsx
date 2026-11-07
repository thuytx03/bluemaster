import { Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { normalizeForSearch } from "src/configs/tools.config"
import type {
  SyncedGroup,
  SyncedIdentity
} from "src/modules/automation/types/max-power-share.types"
import {
  Avatar,
  Button,
  Checkbox,
  EmptyState,
  Input,
  Modal
} from "src/modules/shared/ui"

interface Props {
  open: boolean
  onClose: () => void
  identity: SyncedIdentity
  allGroups: SyncedGroup[]
  selectedGroups: SyncedGroup[]
  onApply: (selected: SyncedGroup[]) => void
}

const norm = (s: string) => normalizeForSearch(s).toLowerCase()

export function GroupSettingsDialog({
  open,
  onClose,
  identity,
  allGroups,
  selectedGroups,
  onApply
}: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(selectedGroups.map((g) => g.groupId))
  )

  useEffect(() => {
    if (open) setChecked(new Set(selectedGroups.map((g) => g.groupId)))
  }, [open, selectedGroups])

  const filtered = useMemo(() => {
    const raw = search.trim()
    if (!raw) return allGroups
    const q = norm(raw)
    return allGroups.filter(
      (g) => norm(g.groupName).includes(q) || g.groupId.includes(raw)
    )
  }, [allGroups, search])

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((g) => checked.has(g.groupId))
  const someFilteredSelected =
    !allFilteredSelected && filtered.some((g) => checked.has(g.groupId))

  function toggleGroup(groupId: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  function toggleAll() {
    setChecked((prev) => {
      const next = new Set(prev)
      filtered.forEach((g) =>
        allFilteredSelected ? next.delete(g.groupId) : next.add(g.groupId)
      )
      return next
    })
  }

  function handleApply() {
    onApply(allGroups.filter((g) => checked.has(g.groupId)))
    onClose()
  }

  return (
    <Modal
      closeLabel={t("max_power_share_button_close")}
      open={open}
      onClose={onClose}
      title={t("max_power_share_dialog_group_settings_title", {
        name: identity.name,
        type: identity.type === "profile" ? "Profile" : "Fanpage"
      })}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            {t("shared_cancel")}
          </Button>
          <Button size="sm" variant="primary" onClick={handleApply}>
            {t("max_power_share_button_apply")} ({checked.size})
          </Button>
        </>
      }>
      <Input
        size="sm"
        prefix={<Search size={14} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("max_power_share_placeholder_search_group")}
      />

      <div className="bm-border-b bm-border-line bm-pb-2">
        <Checkbox
          size="sm"
          checked={allFilteredSelected}
          indeterminate={someFilteredSelected}
          onChange={toggleAll}
          disabled={filtered.length === 0}
          label={
            <span className="bm-text-[12.5px] bm-text-fg-muted">
              {t("max_power_share_label_select_all_filtered")}
            </span>
          }
        />
      </div>

      <div className="bm-divide-y bm-divide-line bm-rounded-lg bm-border bm-border-line">
        {filtered.length === 0 ? (
          <EmptyState compact title={t("max_power_share_no_groups")} />
        ) : (
          filtered.map((g) => (
            <div
              key={g.groupId}
              role="button"
              tabIndex={0}
              onClick={() => toggleGroup(g.groupId)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  toggleGroup(g.groupId)
                }
              }}
              className="bm-flex bm-w-full bm-cursor-pointer bm-items-center bm-gap-2.5 bm-px-3 bm-py-2 bm-text-left bm-transition-colors hover:bm-bg-surface-2">
              <Checkbox
                size="sm"
                checked={checked.has(g.groupId)}
                onChange={() => toggleGroup(g.groupId)}
              />
              <Avatar
                src={g.avatarUrl}
                name={g.groupName}
                size={34}
                rounded="xl"
              />
              <div className="bm-min-w-0 bm-flex-1">
                <a
                  href={`https://www.facebook.com/groups/${g.groupId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="bm-block bm-truncate bm-text-[13px] bm-font-semibold bm-text-brand-ink hover:bm-underline">
                  {g.groupName || g.groupId}
                </a>
                <p className="bm-text-[11.5px] bm-text-fg-subtle">
                  {g.groupId}
                  {g.memberCount && (
                    <span>
                      {" "}
                      ·{" "}
                      {t("max_power_share_member_count_abbr", {
                        count: g.memberCount as unknown as number
                      })}
                    </span>
                  )}
                  {g.privacy && (
                    <span className="bm-ml-1 bm-text-brand-ink">
                      {g.privacy}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  )
}
