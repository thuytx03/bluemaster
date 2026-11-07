import {
  Bot,
  Clock,
  Edit2,
  MoreHorizontal,
  Play,
  Plus,
  RotateCcw,
  Trash2
} from "lucide-react"
import { useTranslation } from "react-i18next"

import type { BotCommentItem } from "src/modules/automation/types/auto-bot-comment.types"
import { fmtDate } from "src/modules/automation/utils/auto-bot-comment.util"
import {
  Button,
  Callout,
  Dropdown,
  EmptyState,
  IconButton,
  Spinner
} from "src/modules/shared/ui"

export default function BotDashboard({
  bots,
  loading,
  error,
  onRefresh,
  onCreateNew,
  onEdit,
  onDelete,
  onRun
}: {
  bots: BotCommentItem[]
  loading: boolean
  error: string | null
  onRefresh: () => void
  onCreateNew: () => void
  onEdit: (bot: BotCommentItem) => void
  onDelete: (bot: BotCommentItem) => void
  onRun: (bot: BotCommentItem) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      <div className="bm-flex bm-flex-wrap bm-items-center bm-justify-between bm-gap-2">
        <p className="bm-text-[12.5px] bm-text-fg-muted">
          {t("auto_comment_dashboard_subtitle")}
        </p>
        <div className="bm-flex bm-items-center bm-gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={
              <RotateCcw
                size={13}
                className={loading ? "bm-animate-spin" : undefined}
              />
            }
            onClick={onRefresh}
            disabled={loading}>
            {t("auto_comment_refresh")}
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus size={13} />}
            onClick={onCreateNew}>
            {t("auto_comment_create_new_bot")}
          </Button>
        </div>
      </div>

      {error && (
        <Callout tone="danger" compact>
          {error}
        </Callout>
      )}

      {loading && (
        <div className="bm-flex bm-items-center bm-justify-center bm-gap-2 bm-py-10 bm-text-[12.5px] bm-text-fg-muted">
          <Spinner size={14} /> {t("auto_comment_loading")}
        </div>
      )}

      {!loading && bots.length === 0 && (
        <div className="bm-rounded-xl2 bm-border bm-border-dashed bm-border-line">
          <EmptyState
            icon={<Bot size={22} />}
            title={
              <>
                {t("auto_comment_empty_prefix")}{" "}
                <strong>{t("auto_comment_create_new_bot")}</strong>{" "}
                {t("auto_comment_empty_suffix")}
              </>
            }
            action={
              <Button
                size="sm"
                variant="primary"
                icon={<Plus size={13} />}
                onClick={onCreateNew}>
                {t("auto_comment_create_new_bot")}
              </Button>
            }
          />
        </div>
      )}

      {!loading && bots.length > 0 && (
        <div className="bm-flex bm-flex-col bm-gap-2">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="bm-rounded-xl2 bm-border bm-border-line bm-bg-surface bm-p-3 bm-shadow-card">
              <div className="bm-flex bm-items-start bm-gap-3">
                <div className="bm-flex bm-h-9 bm-w-9 bm-shrink-0 bm-items-center bm-justify-center bm-rounded-full bm-bg-brand-soft bm-text-brand-ink">
                  <Bot size={18} />
                </div>
                <div className="bm-min-w-0 bm-flex-1">
                  <p className="bm-truncate bm-text-[13px] bm-font-semibold bm-text-fg">
                    {bot.name}
                  </p>
                  <div className="bm-mt-0.5 bm-flex bm-flex-wrap bm-items-center bm-gap-x-3 bm-gap-y-0.5 bm-text-[11.5px] bm-text-fg-muted">
                    <span>
                      {t("auto_comment_groups_count", {
                        count: bot.groups.length
                      })}
                    </span>
                    <span>
                      {t("auto_comment_identities_count", {
                        count: bot.identities.length
                      })}
                    </span>
                    <span>
                      {t("auto_comment_content_count", {
                        count: bot.template_ids.length
                      })}
                    </span>
                    <span>
                      {t("auto_comment_delay_range", {
                        min: bot.delay_min_sec,
                        max: bot.delay_max_sec
                      })}
                    </span>
                  </div>
                  <div className="bm-mt-1 bm-flex bm-items-center bm-gap-1 bm-text-[11.5px] bm-text-fg-subtle">
                    <Clock size={11} />
                    {t("auto_comment_last_run", {
                      date: fmtDate(bot.last_run_at)
                    })}
                  </div>
                </div>
                <div className="bm-flex bm-shrink-0 bm-items-center bm-gap-1">
                  <Button
                    size="xs"
                    variant="primary"
                    icon={<Play size={12} />}
                    onClick={() => onRun(bot)}>
                    {t("auto_comment_run")}
                  </Button>
                  <IconButton
                    size="xs"
                    variant="outline"
                    label={t("auto_comment_edit")}
                    onClick={() => onEdit(bot)}>
                    <Edit2 size={13} />
                  </IconButton>
                  <Dropdown
                    placement="bottom-end"
                    minWidth={150}
                    items={[
                      {
                        key: "delete",
                        label: t("auto_comment_delete_bot_title"),
                        icon: <Trash2 size={13} />,
                        danger: true,
                        onClick: () => onDelete(bot)
                      }
                    ]}>
                    <IconButton
                      size="xs"
                      variant="ghost"
                      label={t("auto_comment_more_actions")}>
                      <MoreHorizontal size={14} />
                    </IconButton>
                  </Dropdown>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
