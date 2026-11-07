import { useTranslation } from "react-i18next"

import type { BotWizardSettings } from "src/modules/automation/types/auto-bot-comment.types"
import {
  Checkbox,
  DescList,
  Field,
  Input,
  NumberInput,
  Surface
} from "src/modules/shared/ui"

/** Step 4: bot name, summary, toggles, delay, batch rest and auto-stop. */
export default function StepSettings({
  botName,
  onBotNameChange,
  settings,
  onChange,
  selectedContent,
  selectedIdentities,
  selectedGroups
}: {
  botName: string
  onBotNameChange: (name: string) => void
  settings: BotWizardSettings
  onChange: (s: BotWizardSettings) => void
  selectedContent: number
  selectedIdentities: number
  selectedGroups: number
}) {
  const { t } = useTranslation()
  const set = <K extends keyof BotWizardSettings>(
    key: K,
    val: BotWizardSettings[K]
  ) => onChange({ ...settings, [key]: val })

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      <Field label={t("auto_comment_bot_name_label")}>
        <Input
          value={botName}
          onChange={(e) => onBotNameChange(e.target.value)}
        />
      </Field>

      <Surface
        padding="sm"
        tone="muted"
        title={t("auto_comment_config_summary_title")}>
        <DescList
          items={[
            {
              label: t("auto_comment_comment_content_label"),
              value: (
                <span className="bm-font-medium bm-text-brand-ink">
                  {t("auto_comment_template_count", { count: selectedContent })}
                </span>
              )
            },
            {
              label: t("auto_comment_step_identity"),
              value: (
                <span className="bm-font-medium bm-text-brand-ink">
                  {selectedIdentities > 0
                    ? t("auto_comment_identities_count", {
                        count: selectedIdentities
                      })
                    : t("auto_comment_default_identity_short")}
                </span>
              )
            },
            {
              label: t("auto_comment_groups_to_run"),
              value: (
                <span className="bm-font-medium bm-text-brand-ink">
                  {t("auto_comment_groups_count", { count: selectedGroups })}
                </span>
              )
            }
          ]}
        />
      </Surface>

      <div className="bm-flex bm-flex-col bm-gap-2 bm-rounded-xl2 bm-border bm-border-line bm-p-3">
        <Checkbox
          checked={settings.likePost}
          onChange={(v) => set("likePost", v)}
          label={t("auto_comment_like_post_toggle")}
        />
        <Checkbox
          checked={settings.skipFailedGroups}
          onChange={(v) => set("skipFailedGroups", v)}
          label={t("auto_comment_skip_failed_groups_toggle")}
          description={t("auto_comment_skip_failed_groups_hint")}
        />
      </div>

      <Surface
        padding="sm"
        title={t("auto_comment_delay_between_turns_label")}
        description={t("auto_comment_delay_hint")}>
        <div className="bm-grid bm-grid-cols-2 bm-gap-2">
          <Field label={t("auto_comment_min_label")}>
            <NumberInput
              size="sm"
              min={5}
              suffix="s"
              value={settings.delayMin}
              onChange={(v) => {
                const min = Math.max(5, v ?? 5)
                onChange({
                  ...settings,
                  delayMin: min,
                  delayMax: Math.max(min, settings.delayMax)
                })
              }}
            />
          </Field>
          <Field label={t("auto_comment_max_label")}>
            <NumberInput
              size="sm"
              min={settings.delayMin}
              suffix="s"
              value={settings.delayMax}
              onChange={(v) =>
                set(
                  "delayMax",
                  Math.max(settings.delayMin, v ?? settings.delayMin)
                )
              }
            />
          </Field>
        </div>
      </Surface>

      <Surface padding="sm" title={t("auto_comment_batch_rest_label")}>
        <div className="bm-grid bm-grid-cols-2 bm-gap-2">
          <Field label={t("auto_comment_after_n_turns_label")}>
            <NumberInput
              size="sm"
              min={1}
              value={settings.batchCount}
              onChange={(v) => set("batchCount", Math.max(1, v ?? 1))}
            />
          </Field>
          <Field label={t("auto_comment_rest_minutes_label")}>
            <NumberInput
              size="sm"
              min={1}
              value={settings.batchRestMinutes}
              onChange={(v) => set("batchRestMinutes", Math.max(1, v ?? 1))}
            />
          </Field>
        </div>
      </Surface>

      <Surface padding="sm" title={t("auto_comment_auto_stop_label")}>
        <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2 bm-text-[12.5px] bm-text-fg-muted">
          <span>{t("auto_comment_stop_after")}</span>
          <NumberInput
            size="sm"
            className="bm-w-24"
            min={1}
            max={500}
            value={settings.skipAfterErrors}
            onChange={(v) =>
              set("skipAfterErrors", Math.min(500, Math.max(1, v ?? 1)))
            }
          />
          <span>{t("auto_comment_consecutive_errors_range")}</span>
        </div>
      </Surface>
    </div>
  )
}
