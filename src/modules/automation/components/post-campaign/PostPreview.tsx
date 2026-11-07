import type { CSSProperties } from "react"
import { useTranslation } from "react-i18next"

import type {
  PostSlot,
  StatusBgCategory,
  StatusBgPreset
} from "src/modules/automation/types/post-campaign.types"
import {
  splitSpin,
  STATUS_MAX_CHARS
} from "src/modules/automation/utils/post-campaign.util"
import { cn } from "src/modules/shared/ui"

interface Props {
  slot: PostSlot
  bgCategories: StatusBgCategory[]
}

export function PostPreview({ slot, bgCategories }: Props) {
  const { t } = useTranslation()
  const allPresets = bgCategories.flatMap((c) => c.presets)
  const isStatus =
    slot.attachKind === "status" || slot.attachKind === "status_images"
  const isImage =
    slot.attachKind === "image" || slot.attachKind === "status_images"

  const spinParts = splitSpin(slot.content)
  const selectedPresets = slot.statusBgIds
    .map((id) => allPresets.find((p) => p.id === id))
    .filter(Boolean) as StatusBgPreset[]

  const maxLen = Math.max(...spinParts.map((s) => s.length), 0)
  const overLimit = isStatus && maxLen > STATUS_MAX_CHARS

  if (
    !slot.content.trim() &&
    !slot.images.length &&
    !slot.video &&
    !slot.videoLinkUrl &&
    !slot.shareLinkUrl
  ) {
    return (
      <div className="bm-flex bm-h-20 bm-items-center bm-justify-center bm-rounded-lg bm-border bm-border-dashed bm-border-line bm-text-[12.5px] bm-text-fg-muted">
        {t("campaign_manager_preview_placeholder")}
      </div>
    )
  }

  return (
    <div className="bm-flex bm-flex-col bm-gap-2 bm-rounded-lg bm-border bm-border-line bm-bg-surface-2/60 bm-p-3">
      <p className="bm-text-[11px] bm-font-semibold bm-uppercase bm-tracking-wide bm-text-fg-muted">
        {t("campaign_manager_preview_label")}
      </p>

      {isStatus && selectedPresets.length > 0 && (
        <div
          className={cn(
            "bm-flex bm-gap-2 bm-overflow-x-auto bm-pb-1",
            spinParts.length > 1 && "bm-flex-wrap"
          )}>
          {(spinParts.length > 1 ? spinParts : [""]).map((part, i) => {
            const preset = selectedPresets[i % selectedPresets.length]
            const text = part || slot.content
            const bgStyle: CSSProperties = preset.imgUrl
              ? {
                  backgroundImage: `url(${preset.imgUrl})`,
                  backgroundColor: preset.bgColor,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }
              : preset.gradColor
                ? {
                    background: `linear-gradient(${preset.gradDir ?? "135deg"}, ${preset.bgColor}, ${preset.gradColor})`
                  }
                : { backgroundColor: preset.bgColor }
            return (
              <div
                key={i}
                className="bm-flex bm-shrink-0 bm-flex-col bm-items-center bm-gap-1">
                <div
                  className="bm-flex bm-h-28 bm-w-48 bm-items-center bm-justify-center bm-rounded-lg bm-p-3 bm-text-center bm-text-[13px] bm-font-semibold bm-leading-snug"
                  style={{ ...bgStyle, color: preset.textColor ?? "#fff" }}>
                  {text}
                </div>
                {spinParts.length > 1 && (
                  <span className="bm-text-[11px] bm-text-fg-muted">
                    {t("campaign_manager_spin_index", {
                      index: i + 1
                    })}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {isStatus && selectedPresets.length === 0 && slot.content && (
        <p className="bm-text-[12.5px] bm-italic bm-text-fg-muted">
          {t("campaign_manager_no_background_selected")}
        </p>
      )}

      {isImage && slot.images.length > 0 && (
        <div className="bm-flex bm-flex-wrap bm-gap-1.5">
          {slot.images.slice(0, 6).map((img, i) => (
            <img
              key={i}
              src={img.dataUrl}
              alt=""
              className="bm-h-16 bm-w-16 bm-rounded-lg bm-border bm-border-line bm-object-cover"
            />
          ))}
          {slot.images.length > 6 && (
            <div className="bm-flex bm-h-16 bm-w-16 bm-items-center bm-justify-center bm-rounded-lg bm-border bm-border-line bm-bg-surface-2 bm-text-[12.5px] bm-text-fg-muted">
              +{slot.images.length - 6}
            </div>
          )}
        </div>
      )}

      {!isStatus && slot.content && (
        <p className="bm-whitespace-pre-wrap bm-break-words bm-text-[13px] bm-text-fg">
          {slot.content}
        </p>
      )}

      {slot.attachKind === "video" && slot.video && (
        <div className="bm-flex bm-items-center bm-gap-2 bm-rounded-lg bm-bg-surface bm-px-3 bm-py-2">
          <span className="bm-text-lg">🎬</span>
          <span className="bm-truncate bm-text-[12.5px] bm-text-fg-muted">
            {slot.video.name}
          </span>
        </div>
      )}

      {slot.attachKind === "video_link" && slot.videoLinkUrl && (
        <div className="bm-flex bm-items-center bm-gap-2 bm-rounded-lg bm-bg-surface bm-px-3 bm-py-2">
          <span className="bm-text-lg">🔗</span>
          <span className="bm-truncate bm-text-[12.5px] bm-text-brand-ink">
            {slot.videoLinkUrl}
          </span>
        </div>
      )}

      {slot.attachKind === "link" && slot.shareLinkUrl && (
        <div className="bm-flex bm-items-center bm-gap-2 bm-rounded-lg bm-bg-surface bm-px-3 bm-py-2">
          <span className="bm-text-lg">🔗</span>
          <span className="bm-truncate bm-text-[12.5px] bm-text-brand-ink">
            {slot.shareLinkUrl}
          </span>
        </div>
      )}

      {(slot.feeling || slot.checkin) && (
        <div className="bm-flex bm-flex-wrap bm-gap-2 bm-text-[12.5px] bm-text-fg-muted">
          {slot.feeling && (
            <span>
              {slot.feeling.emoji} {slot.feeling.name}
            </span>
          )}
          {slot.checkin && <span>📍 {slot.checkin.name}</span>}
        </div>
      )}

      {isStatus && slot.content && (
        <p
          className={cn(
            "bm-text-[12px]",
            overLimit ? "bm-font-semibold bm-text-danger" : "bm-text-fg-muted"
          )}>
          {t("campaign_manager_char_count", {
            count: maxLen,
            max: STATUS_MAX_CHARS
          })}
          {spinParts.length > 1 && ` · ${spinParts.length} SPIN`}
          {selectedPresets.length > 1 &&
            ` · ${t("campaign_manager_backgrounds_random_count", { count: selectedPresets.length })}`}
          {overLimit && ` ${t("campaign_manager_over_limit_warning")}`}
        </p>
      )}
    </div>
  )
}
