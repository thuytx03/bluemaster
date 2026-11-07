import { Settings2, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { SelectedIdentityRow } from "src/modules/automation/types/max-power-share.types"
import {
  Avatar,
  Badge,
  Checkbox,
  IconButton,
  Spinner
} from "src/modules/shared/ui"

interface Props {
  row: SelectedIdentityRow
  onRemove: () => void
  onToggleTimeline: () => void
  onOpenGroupSettings: () => void
}

export function IdentityRow({
  row,
  onRemove,
  onToggleTimeline,
  onOpenGroupSettings
}: Props) {
  const { t } = useTranslation()
  const { identity } = row

  return (
    <div className="bm-flex bm-flex-col bm-gap-2 bm-rounded-xl bm-border bm-border-line bm-bg-surface bm-p-2.5">
      <div className="bm-flex bm-items-center bm-gap-2.5">
        <Avatar src={identity.avatar} name={identity.name} size={36} />
        <div className="bm-min-w-0 bm-flex-1">
          <div className="bm-flex bm-items-center bm-gap-1.5">
            <Badge
              tone={identity.type === "profile" ? "brand" : "violet"}
              size="xs">
              {identity.type === "profile" ? "PROFILE" : "FANPAGE"}
            </Badge>
            <span className="bm-truncate bm-text-[13px] bm-font-semibold bm-text-fg">
              {identity.name}
            </span>
          </div>
          <div className="bm-text-[11px] bm-text-fg-subtle">{identity.uid}</div>
          {row.loadingGroups ? (
            <div className="bm-mt-0.5 bm-flex bm-items-center bm-gap-1 bm-text-[11.5px] bm-text-fg-muted">
              <Spinner size={11} /> {t("max_power_share_loading_groups")}
            </div>
          ) : (
            <div className="bm-mt-0.5 bm-text-[12px] bm-font-medium bm-text-brand-ink">
              {t("max_power_share_groups_selected_count", {
                count: row.selectedGroups.length
              })}
              <span className="bm-text-fg-subtle">
                {" "}
                / {row.allGroups.length}
              </span>
            </div>
          )}
        </div>
        <div className="bm-flex bm-shrink-0 bm-items-center bm-gap-1">
          <IconButton
            label={t("max_power_share_title_group_settings")}
            variant="outline"
            size="xs"
            onClick={onOpenGroupSettings}
            disabled={row.loadingGroups}>
            <Settings2 size={14} />
          </IconButton>
          <IconButton
            label={t("max_power_share_title_remove")}
            variant="danger"
            size="xs"
            onClick={onRemove}>
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>

      <Checkbox
        size="sm"
        checked={row.shareToTimeline}
        onChange={onToggleTimeline}
        label={
          <span className="bm-text-[12.5px] bm-text-fg-muted">
            {t("max_power_share_label_share_to_timeline")}
          </span>
        }
      />
    </div>
  )
}
