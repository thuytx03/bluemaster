import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import StepContent from "src/modules/automation/components/auto-bot-comment/StepContent"
import StepGroups from "src/modules/automation/components/auto-bot-comment/StepGroups"
import StepIdentities from "src/modules/automation/components/auto-bot-comment/StepIdentities"
import StepSettings from "src/modules/automation/components/auto-bot-comment/StepSettings"
import { StepIndicator } from "src/modules/automation/components/post-campaign/StepIndicator"
import type { useAutoBotCommentTemplates } from "src/modules/automation/hooks/useAutoBotCommentTemplates"
import type {
  BotCommentGroup,
  BotCommentIdentity,
  BotCommentItem,
  BotCommentPayload,
  BotWizardState,
  CommentTemplate
} from "src/modules/automation/types/auto-bot-comment.types"
import {
  emptyWizard,
  wizardFromBot
} from "src/modules/automation/utils/auto-bot-comment.util"
import { Button } from "src/modules/shared/ui"

type Step = 1 | 2 | 3 | 4

/** Create / edit a bot in 4 steps: content → identities → groups → settings. */
export default function BotWizard({
  editingBot,
  templatesApi,
  onSave,
  onCancel
}: {
  editingBot: BotCommentItem | null
  templatesApi: ReturnType<typeof useAutoBotCommentTemplates>
  onSave: (payload: BotCommentPayload) => Promise<boolean>
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [wizard, setWizard] = useState<BotWizardState>(() =>
    editingBot ? wizardFromBot(editingBot) : emptyWizard()
  )

  // Templates deleted since the bot was saved do not count
  const existingTemplateIds = new Set(templatesApi.templates.map((x) => x.id))
  const selectedContentCount = templatesApi.loading
    ? wizard.selectedContent.size
    : [...wizard.selectedContent].filter((id) => existingTemplateIds.has(id))
        .length

  const steps = [
    { n: 1, label: t("auto_comment_step_content") },
    { n: 2, label: t("auto_comment_step_identity") },
    { n: 3, label: t("auto_comment_step_groups") },
    { n: 4, label: t("auto_comment_step_settings") }
  ]

  function toggleContent(tpl: CommentTemplate) {
    setWizard((prev) => {
      const next = new Set(prev.selectedContent)
      if (next.has(tpl.id)) next.delete(tpl.id)
      else next.add(tpl.id)
      return { ...prev, selectedContent: next }
    })
  }

  function toggleIdentity(id: BotCommentIdentity) {
    setWizard((prev) => {
      const next = new Set(prev.selectedIdentities)
      const map = new Map(prev.identityMap)
      if (next.has(id.id)) {
        next.delete(id.id)
        map.delete(id.id)
      } else {
        next.add(id.id)
        map.set(id.id, id)
      }
      return { ...prev, selectedIdentities: next, identityMap: map }
    })
  }

  function toggleGroup(g: BotCommentGroup) {
    setWizard((prev) => {
      const next = new Map(prev.selectedGroups)
      if (next.has(g.groupId)) next.delete(g.groupId)
      else next.set(g.groupId, g)
      return { ...prev, selectedGroups: next }
    })
  }

  /** "Select all" / "confirm" buttons add to the selection (the source replaced it). */
  function addGroups(groups: BotCommentGroup[]) {
    setWizard((prev) => {
      const next = new Map(prev.selectedGroups)
      groups.forEach((g) => next.set(g.groupId, g))
      return { ...prev, selectedGroups: next }
    })
  }

  async function handleSave() {
    setSaving(true)
    const payload: BotCommentPayload = {
      name: wizard.botName.trim() || emptyWizard().botName,
      identities: [...wizard.selectedIdentities]
        .map((id) => wizard.identityMap.get(id))
        .filter((x): x is BotCommentIdentity => !!x),
      groups: [...wizard.selectedGroups.values()],
      template_ids: [...wizard.selectedContent].filter((id) =>
        existingTemplateIds.has(id)
      ),
      delay_min_sec: wizard.settings.delayMin,
      delay_max_sec: wizard.settings.delayMax,
      batch_count: wizard.settings.batchCount,
      batch_rest_minutes: wizard.settings.batchRestMinutes,
      like_post: wizard.settings.likePost,
      skip_failed_groups: wizard.settings.skipFailedGroups,
      stop_after_consecutive_errors: wizard.settings.skipAfterErrors
    }
    try {
      await onSave(payload)
    } finally {
      setSaving(false)
    }
  }

  const canNext =
    step === 1
      ? selectedContentCount > 0
      : step === 3
        ? wizard.selectedGroups.size > 0
        : true
  const footerInfo =
    step === 1
      ? t("auto_comment_content_selected_count", {
          count: selectedContentCount
        })
      : step === 3
        ? t("auto_comment_groups_selected_count", {
            count: wizard.selectedGroups.size
          })
        : null

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      <div className="bm-flex bm-items-center bm-justify-between bm-gap-2">
        <span className="bm-truncate bm-text-[13.5px] bm-font-semibold bm-text-fg">
          {editingBot
            ? t("auto_comment_edit_bot_title")
            : t("auto_comment_create_new_bot")}
        </span>
        <Button
          size="xs"
          variant="ghost"
          icon={<X size={13} />}
          onClick={onCancel}>
          {t("auto_comment_cancel")}
        </Button>
      </div>

      <StepIndicator
        steps={steps}
        current={step}
        onBack={() => (step === 1 ? onCancel() : setStep((step - 1) as Step))}
      />

      {step === 1 && (
        <StepContent
          templatesApi={templatesApi}
          selected={wizard.selectedContent}
          onToggle={toggleContent}
        />
      )}
      {step === 2 && (
        <StepIdentities
          selected={wizard.selectedIdentities}
          selectedMap={wizard.identityMap}
          onToggle={toggleIdentity}
        />
      )}
      {step === 3 && (
        <StepGroups
          selected={wizard.selectedGroups}
          onToggle={toggleGroup}
          onAddMany={addGroups}
        />
      )}
      {step === 4 && (
        <StepSettings
          botName={wizard.botName}
          onBotNameChange={(botName) => setWizard((p) => ({ ...p, botName }))}
          settings={wizard.settings}
          onChange={(settings) => setWizard((p) => ({ ...p, settings }))}
          selectedContent={selectedContentCount}
          selectedIdentities={wizard.selectedIdentities.size}
          selectedGroups={wizard.selectedGroups.size}
        />
      )}

      <div className="bm-sticky bm-bottom-0 bm-z-10 bm-flex bm-items-center bm-justify-between bm-gap-2 bm-border-t bm-border-line bm-bg-surface bm-py-2">
        {step > 1 ? (
          <Button
            size="sm"
            variant="outline"
            icon={<ChevronLeft size={14} />}
            onClick={() => setStep((step - 1) as Step)}>
            {t("auto_comment_back")}
          </Button>
        ) : (
          <span />
        )}
        {footerInfo && (
          <span className="bm-flex bm-min-w-0 bm-items-center bm-gap-1 bm-truncate bm-text-[12px] bm-font-medium bm-text-brand-ink">
            {footerInfo}
            {step === 3 && wizard.selectedGroups.size > 0 && (
              <Button
                size="xs"
                variant="link"
                onClick={() =>
                  setWizard((p) => ({ ...p, selectedGroups: new Map() }))
                }>
                {t("auto_comment_clear_selection")}
              </Button>
            )}
          </span>
        )}
        {step < 4 ? (
          <Button
            size="sm"
            variant="primary"
            iconRight={<ChevronRight size={14} />}
            disabled={!canNext}
            onClick={() => setStep((step + 1) as Step)}>
            {t("auto_comment_next_step")}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="primary"
            loading={saving}
            disabled={!canNext}
            onClick={handleSave}>
            {t("auto_comment_save_bot")}
          </Button>
        )}
      </div>
    </div>
  )
}
