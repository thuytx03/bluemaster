import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import BotDashboard from "src/modules/automation/components/auto-bot-comment/BotDashboard"
import BotRunningView from "src/modules/automation/components/auto-bot-comment/BotRunningView"
import BotWizard from "src/modules/automation/components/auto-bot-comment/BotWizard"
import { useAutoBotComment } from "src/modules/automation/hooks/useAutoBotComment"
import { useAutoBotCommentBots } from "src/modules/automation/hooks/useAutoBotCommentBots"
import { useAutoBotCommentTemplates } from "src/modules/automation/hooks/useAutoBotCommentTemplates"
import storage from "src/modules/automation/services/auto-bot-comment-storage.service"
import type {
  BotCommentConfig,
  BotCommentItem,
  BotCommentPayload,
  CommentTemplate
} from "src/modules/automation/types/auto-bot-comment.types"
import { ConfirmDialog } from "src/modules/shared/ui"

type MainView = "dashboard" | "wizard" | "running"

export function AutoBotCommentPanel() {
  const { t } = useTranslation()
  const runner = useAutoBotComment()
  const {
    bots,
    loading,
    error,
    fetchBots,
    createBot,
    updateBot,
    deleteBot,
    markRun
  } = useAutoBotCommentBots()
  const templatesApi = useAutoBotCommentTemplates()

  const [view, setView] = useState<MainView>("dashboard")
  const [editingBot, setEditingBot] = useState<BotCommentItem | null>(null)
  const [runningBot, setRunningBot] = useState<BotCommentItem | null>(null)
  const [deleting, setDeleting] = useState<BotCommentItem | null>(null)

  useEffect(() => {
    void fetchBots()
  }, [fetchBots])

  function openWizard(bot: BotCommentItem | null) {
    setEditingBot(bot)
    setView("wizard")
  }

  async function handleSave(payload: BotCommentPayload): Promise<boolean> {
    const saved = editingBot
      ? await updateBot(editingBot.id, payload)
      : await createBot(payload)
    if (!saved) {
      toast.error(t("auto_comment_error_save_bot"))
      return false
    }
    toast.success(t("auto_comment_bot_saved"))
    void fetchBots()
    setView("dashboard")
    return true
  }

  async function handleRun(bot: BotCommentItem) {
    // Read templates fresh: the source used a list loaded once on mount, so
    // templates created / edited in the wizard afterwards were missing at run time
    const templates = await storage.listTemplates().catch(() => [])
    const byId = new Map(templates.map((x) => [x.id, x]))
    const botTemplates = bot.template_ids
      .map((id) => byId.get(id))
      .filter((x): x is CommentTemplate => !!x)

    const config: BotCommentConfig = {
      groups: bot.groups,
      templates: botTemplates.map((x) => ({
        content: x.content,
        images: (x.image_urls ?? [])
          .filter((u) => u.startsWith("data:"))
          .map((u) => ({ dataUrl: u, name: "img.jpg" }))
      })),
      identities: bot.identities,
      delayMin: bot.delay_min_sec,
      delayMax: bot.delay_max_sec,
      batchCount: bot.batch_count,
      batchRestMinutes: bot.batch_rest_minutes,
      likePost: bot.like_post,
      skipFailedGroups: bot.skip_failed_groups,
      skipAfterErrors: bot.stop_after_consecutive_errors
    }

    runner.reset()
    setRunningBot(bot)
    setView("running")
    await markRun(bot.id)
    void runner.run(config)
  }

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      {view === "dashboard" && (
        <BotDashboard
          bots={bots}
          loading={loading}
          error={error}
          onRefresh={() => void fetchBots()}
          onCreateNew={() => openWizard(null)}
          onEdit={openWizard}
          onDelete={setDeleting}
          onRun={(bot) => void handleRun(bot)}
        />
      )}

      {view === "wizard" && (
        <BotWizard
          key={editingBot?.id ?? "new"}
          editingBot={editingBot}
          templatesApi={templatesApi}
          onSave={handleSave}
          onCancel={() => setView("dashboard")}
        />
      )}

      {view === "running" && (
        <BotRunningView
          botName={runningBot?.name ?? ""}
          runState={runner.runState}
          progress={runner.progress}
          logs={runner.logs}
          countdown={runner.countdown}
          statusMsg={runner.statusMsg}
          error={runner.error}
          onPause={runner.pause}
          onResume={runner.resume}
          onStop={runner.stop}
          onBack={() => {
            runner.reset()
            setRunningBot(null)
            setView("dashboard")
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        destructive
        title={t("auto_comment_delete_bot_title")}
        description={
          deleting
            ? t("auto_comment_delete_bot_confirm", { name: deleting.name })
            : undefined
        }
        onConfirm={() => {
          if (deleting) void deleteBot(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}
