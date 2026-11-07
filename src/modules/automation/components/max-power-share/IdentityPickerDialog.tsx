import { RefreshCw, Search, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { normalizeForSearch } from "src/configs/tools.config"
import { useMaxPowerShareIdentities } from "src/modules/automation/hooks/useMaxPowerShareIdentities"
import type { SyncedIdentity } from "src/modules/automation/types/max-power-share.types"
import {
  Avatar,
  Badge,
  Button,
  Callout,
  cn,
  EmptyState,
  IconButton,
  Input,
  Modal,
  Spinner
} from "src/modules/shared/ui"

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (identity: SyncedIdentity) => void
  /** Called after the profile's groups were re-synced, so rows already added can reload them */
  onSynced: (uid: string) => void
  selectedUids: Set<string>
  profileUid?: string
}

const norm = (s: string) => normalizeForSearch(s).toLowerCase()

export function IdentityPickerDialog({
  open,
  onClose,
  onSelect,
  onSynced,
  selectedUids,
  profileUid
}: Props) {
  const { t } = useTranslation()
  const { identities, loading, syncing, syncProgress, load, sync, canSync } =
    useMaxPowerShareIdentities()
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  const handleSync = async () => {
    const count = await sync()
    if (count > 0 && profileUid) onSynced(profileUid)
  }

  const filtered = useMemo(() => {
    const q = norm(search.trim())
    if (!q) return identities
    return identities.filter(
      (i) => norm(i.name).includes(q) || i.uid.includes(search.trim())
    )
  }, [identities, search])

  const profileHasGroups = identities.some(
    (i) => i.uid === profileUid && i.groupCount > 0
  )
  const busy = loading || syncing

  return (
    <Modal
      closeLabel={t("max_power_share_button_close")}
      open={open}
      onClose={onClose}
      title={
        <span className="bm-flex bm-items-center bm-gap-2">
          <Users size={16} className="bm-text-brand-ink" />{" "}
          {t("max_power_share_dialog_add_identity_title")}
        </span>
      }
      footer={
        <Button size="sm" variant="outline" onClick={onClose}>
          {t("max_power_share_button_close")}
        </Button>
      }>
      <p className="bm-text-[12.5px] bm-text-fg-muted">
        {t("max_power_share_add_identity_hint_prefix")}{" "}
        <strong>{t("max_power_share_add_identity_hint_label")}</strong>{" "}
        {t("max_power_share_add_identity_hint_suffix")}
      </p>

      <div className="bm-flex bm-gap-2">
        <Input
          size="sm"
          className="bm-flex-1"
          prefix={<Search size={14} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("max_power_share_placeholder_search_identity")}
        />
        <IconButton
          label={t("max_power_share_title_sync_groups")}
          variant="outline"
          onClick={handleSync}
          disabled={busy || !canSync}>
          <RefreshCw size={14} className={cn(syncing && "bm-animate-spin")} />
        </IconButton>
      </div>

      {!busy && !profileHasGroups && (
        <Callout
          tone="warning"
          compact
          action={
            <Button
              size="xs"
              variant="primary"
              icon={<RefreshCw size={13} />}
              onClick={handleSync}
              disabled={!canSync}>
              {t("max_power_share_button_sync_groups")}
            </Button>
          }>
          {t("max_power_share_no_synced_groups")}
        </Callout>
      )}

      <div className="bm-flex bm-flex-col bm-gap-2">
        {busy ? (
          <div className="bm-flex bm-flex-col bm-items-center bm-justify-center bm-gap-2 bm-py-8 bm-text-[12.5px] bm-text-fg-muted">
            <Spinner size={20} />
            <span>{syncProgress || t("max_power_share_loading")}</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            compact
            icon={<Users size={20} />}
            title={t("max_power_share_no_data")}
          />
        ) : (
          filtered.map((iden) => {
            const selected = selectedUids.has(iden.uid)
            return (
              <button
                key={iden.uid}
                type="button"
                disabled={selected}
                onClick={() => {
                  onSelect(iden)
                  onClose()
                }}
                className={cn(
                  "bm-flex bm-w-full bm-items-center bm-gap-3 bm-rounded-xl bm-border bm-p-2.5 bm-text-left bm-transition-colors",
                  selected
                    ? "bm-cursor-not-allowed bm-border-brand/40 bm-bg-brand-soft bm-opacity-60"
                    : "bm-border-line hover:bm-bg-surface-2"
                )}>
                <Avatar src={iden.avatar} name={iden.name} size={40} />
                <div className="bm-min-w-0 bm-flex-1">
                  <div className="bm-flex bm-items-center bm-gap-1.5">
                    <Badge
                      tone={iden.type === "profile" ? "brand" : "violet"}
                      size="xs">
                      {iden.type === "profile" ? "PROFILE" : "FANPAGE"}
                    </Badge>
                    <span className="bm-truncate bm-text-[13px] bm-font-semibold bm-text-fg">
                      {iden.name}
                    </span>
                  </div>
                  <div className="bm-text-[11.5px] bm-text-fg-subtle">
                    {iden.uid}
                  </div>
                  <div className="bm-text-[12px] bm-font-medium bm-text-brand-ink">
                    {t("max_power_share_synced_groups_count", {
                      count: iden.groupCount
                    })}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </Modal>
  )
}
