import { useTranslation } from "react-i18next"

import type {
  StatusBgCategory,
  StatusBgPreset
} from "src/modules/automation/types/post-campaign.types"
import { Button, cn, Modal } from "src/modules/shared/ui"

interface Props {
  selected: string[]
  multiSelect: boolean
  onSelect: (ids: string[]) => void
  onClose: () => void
  categories: StatusBgCategory[]
}

/** Status background picker: one preset, or up to 10 picked at random per group when `multiSelect`. */
export function StatusBgPicker({
  selected,
  multiSelect,
  onSelect,
  onClose,
  categories
}: Props) {
  const { t } = useTranslation()
  const selectedSet = new Set(selected)

  function toggle(preset: StatusBgPreset) {
    if (multiSelect) {
      const next = selectedSet.has(preset.id)
        ? selected.filter((x) => x !== preset.id)
        : selected.length < 10
          ? [...selected, preset.id]
          : selected
      onSelect(next)
    } else {
      onSelect(selectedSet.has(preset.id) ? [] : [preset.id])
    }
  }

  return (
    <Modal
      open
      closeLabel={t("campaign_manager_done")}
      title={t("campaign_manager_choose_status_bg_title")}
      subtitle={
        multiSelect && (
          <p className="bm-rounded-lg bm-bg-warning-soft bm-px-2 bm-py-1 bm-text-[12px] bm-text-warning">
            {t("campaign_manager_choose_bg_prefix")}{" "}
            <strong>{t("campaign_manager_choose_bg_max")}</strong>{" "}
            {t("campaign_manager_choose_bg_middle")}{" "}
            <strong>{t("campaign_manager_choose_bg_random")}</strong>{" "}
            {t("campaign_manager_choose_bg_suffix")}
          </p>
        )
      }
      onClose={onClose}
      footer={
        <div className="bm-flex bm-w-full bm-items-center bm-justify-between bm-gap-2">
          <span className="bm-text-[12.5px] bm-text-fg-muted">
            {selected.length > 0
              ? t("campaign_manager_backgrounds_selected", {
                  count: selected.length
                })
              : t("campaign_manager_no_background_selected")}
          </span>
          <div className="bm-flex bm-gap-2">
            {selected.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => onSelect([])}>
                {t("campaign_manager_remove_all")}
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={onClose}>
              {t("campaign_manager_done")}
            </Button>
          </div>
        </div>
      }>
      <div className="bm-flex bm-flex-col bm-gap-3 bm-pr-1">
        {categories.map((cat, catIdx) => (
          <div key={catIdx}>
            <p className="bm-mb-1.5 bm-text-[12.5px] bm-font-semibold bm-text-fg-muted">
              {cat.name}
            </p>
            <div className="bm-grid bm-grid-cols-6 bm-gap-1.5">
              {cat.presets.map((preset) => {
                const isSelected = selectedSet.has(preset.id)
                const thumb = preset.thumbUrl ?? preset.imgUrl
                return (
                  <button
                    key={preset.id}
                    type="button"
                    title={preset.desc}
                    onClick={() => toggle(preset)}
                    className={cn(
                      "bm-relative bm-aspect-square bm-w-full bm-overflow-hidden bm-rounded-lg bm-border-2 bm-transition-all",
                      isSelected
                        ? "bm-border-brand bm-shadow-glow"
                        : "bm-border-transparent hover:bm-border-line-strong"
                    )}
                    style={{ backgroundColor: preset.bgColor }}>
                    {thumb && (
                      <img
                        src={thumb}
                        alt=""
                        className="bm-absolute bm-inset-0 bm-h-full bm-w-full bm-object-cover"
                      />
                    )}
                    {isSelected && (
                      <div className="bm-absolute bm-inset-0 bm-flex bm-items-center bm-justify-center bm-bg-black/30">
                        <span className="bm-text-[13px] bm-font-bold bm-text-white">
                          ✓
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
