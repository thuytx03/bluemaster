import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  Download,
  ExternalLink,
  Pause,
  Play,
  Repeat,
  Square,
  XCircle
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import type {
  BotCommentLog,
  BotRunProgress,
  BotRunState
} from "src/modules/automation/types/auto-bot-comment.types"
import {
  Button,
  Callout,
  cn,
  EmptyState,
  Progress,
  Segmented,
  Spinner,
  StatTile,
  Surface
} from "src/modules/shared/ui"
import { exportToCSV } from "src/utils/export.util"

type LogTab = "all" | "success" | "fail"

const LOG_TONE: Record<BotCommentLog["kind"], string> = {
  success: "bm-text-emerald-400",
  fail: "bm-text-red-400",
  error: "bm-text-yellow-400",
  system: "bm-italic bm-text-gray-400",
  info: "bm-text-gray-200"
}

function PostLink({ href, className }: { href?: string; className?: string }) {
  const { t } = useTranslation()
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "bm-ml-1.5 bm-inline-flex bm-items-center bm-gap-0.5 bm-underline",
        className
      )}>
      {t("auto_comment_view_post")}
      <ExternalLink size={10} />
    </a>
  )
}

/** Live view of a running bot: status, counters, tree log and success / failure lists. */
export default function BotRunningView({
  botName,
  runState,
  progress,
  logs,
  countdown,
  statusMsg,
  error,
  onPause,
  onResume,
  onStop,
  onBack
}: {
  botName: string
  runState: BotRunState
  progress: BotRunProgress
  logs: BotCommentLog[]
  countdown: number | null
  statusMsg: string
  error: string | null
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onBack: () => void
}) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<LogTab>("all")
  const logBoxRef = useRef<HTMLDivElement>(null)

  const isRunning = runState === "running"
  const isPaused = runState === "paused"
  const isDone = runState === "done" || runState === "idle"
  const isActive = isRunning || isPaused

  // Follow the log (scroll the box only, never the whole page)
  useEffect(() => {
    const box = logBoxRef.current
    if (box) box.scrollTop = box.scrollHeight
  }, [logs.length, tab])

  const successLogs = logs.filter((l) => l.kind === "success")
  const failLogs = logs.filter((l) => l.kind === "fail" || l.kind === "error")
  // The bot loops over the groups forever: show the position inside the current round
  const inRound =
    progress.total > 0 ? ((progress.current - 1) % progress.total) + 1 : 0
  const pct =
    progress.total > 0 && progress.current > 0
      ? Math.round((inRound / progress.total) * 100)
      : 0

  const title =
    runState === "error"
      ? t("auto_comment_run_error")
      : isDone && logs.length > 0
        ? t("auto_comment_run_done")
        : isPaused
          ? t("auto_comment_run_paused")
          : statusMsg || t("auto_comment_run_running")

  const handleExport = () => {
    const rows =
      tab === "success"
        ? successLogs
        : tab === "fail"
          ? failLogs
          : [...successLogs, ...failLogs]
    exportToCSV(
      [
        "#",
        "Time",
        "Turn",
        "Group",
        "Group ID",
        "Post ID",
        "Comment",
        "Result",
        "Message",
        "Link"
      ],
      rows.map((l, i) => [
        i + 1,
        l.ts,
        l.cycleIndex ?? "",
        l.groupName ?? "",
        l.groupId ?? "",
        l.postId ?? "",
        l.commentPreview ?? "",
        l.kind === "success" ? "OK" : "FAIL",
        l.msg,
        l.permalink ?? ""
      ]),
      `auto-bot-comment-${tab}-${Date.now()}`
    )
  }

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      <Surface
        padding="sm"
        icon={
          runState === "error" ? (
            <XCircle size={15} className="bm-text-danger" />
          ) : isDone && logs.length > 0 ? (
            <CheckCircle2 size={15} className="bm-text-success" />
          ) : isRunning ? (
            <Spinner size={14} />
          ) : (
            <Pause size={14} className="bm-text-warning" />
          )
        }
        title={title}
        description={botName}
        extra={
          <span className="bm-text-[16px] bm-font-bold bm-tabular-nums bm-text-brand-ink">
            {pct}%
          </span>
        }
        bodyClassName="bm-flex bm-flex-col bm-gap-2">
        <Progress
          value={pct}
          size="md"
          tone={isDone ? "success" : "brand"}
          striped={isRunning}
        />
        <p className="bm-text-[12px] bm-text-fg-muted">
          {t("auto_comment_turn_progress", {
            current: progress.current,
            total: progress.total
          })}
        </p>
        {countdown !== null && countdown > 0 && (
          <div className="bm-flex bm-items-center bm-gap-1.5 bm-rounded-lg bm-border bm-border-warning/30 bm-bg-warning-soft bm-px-3 bm-py-1.5 bm-text-[12px] bm-font-medium bm-text-warning">
            <Clock size={12} />{" "}
            {t("auto_comment_waiting_seconds", { seconds: countdown })}
          </div>
        )}
      </Surface>

      <div className="bm-grid bm-grid-cols-3 bm-gap-2">
        <StatTile
          size="sm"
          tone="info"
          icon={<Repeat size={14} />}
          label={t("auto_comment_stat_turns_run")}
          value={progress.current}
        />
        <StatTile
          size="sm"
          tone="success"
          icon={<CheckCircle2 size={14} />}
          label={t("auto_comment_stat_success")}
          value={progress.success}
        />
        <StatTile
          size="sm"
          tone="danger"
          icon={<XCircle size={14} />}
          label={t("auto_comment_stat_fail")}
          value={progress.fail}
        />
      </div>

      {error && (
        <Callout tone="danger" compact>
          {error}
        </Callout>
      )}

      <div className="bm-flex bm-items-center bm-justify-between bm-gap-2">
        <Segmented<LogTab>
          size="sm"
          value={tab}
          onChange={setTab}
          options={[
            {
              value: "all",
              label: t("auto_comment_log_tab_all", { count: logs.length })
            },
            {
              value: "success",
              label: t("auto_comment_log_tab_success", {
                count: successLogs.length
              })
            },
            {
              value: "fail",
              label: t("auto_comment_log_tab_fail", { count: failLogs.length })
            }
          ]}
        />
        <Button
          size="xs"
          variant="outline"
          icon={<Download size={13} />}
          disabled={successLogs.length + failLogs.length === 0}
          onClick={handleExport}>
          CSV
        </Button>
      </div>

      {tab === "all" && (
        <div
          ref={logBoxRef}
          className="bm-max-h-[360px] bm-min-h-[160px] bm-overflow-y-auto bm-rounded-xl bm-bg-gray-950 bm-p-2 bm-font-mono bm-text-[11px] bm-text-gray-100">
          {logs.length === 0 && (
            <p className="bm-py-2 bm-italic bm-text-gray-500">
              {t("auto_comment_no_log_yet")}
            </p>
          )}
          {logs.map((log) => {
            const isRoot = log.isRoot
            const isChild = log.isChild && !isRoot
            return (
              <div
                key={log.id}
                className={cn(
                  "bm-flex bm-items-start bm-gap-1.5 bm-py-0.5 bm-leading-relaxed",
                  isChild && "bm-ml-3 bm-border-l bm-border-gray-700 bm-pl-2",
                  isRoot && "bm-mt-1.5 bm-border-t bm-border-gray-800 bm-pt-1",
                  LOG_TONE[log.kind]
                )}>
                <span className="bm-shrink-0 bm-text-gray-600">[{log.ts}]</span>
                <span className="bm-min-w-0 bm-flex-1 bm-break-words">
                  {log.msg}
                  <PostLink
                    href={log.permalink}
                    className="bm-text-sky-400 hover:bm-text-sky-300"
                  />
                </span>
              </div>
            )
          })}
        </div>
      )}

      {tab !== "all" && (
        <div className="bm-flex bm-max-h-[360px] bm-flex-col bm-gap-1 bm-overflow-y-auto">
          {(tab === "success" ? successLogs : failLogs).length === 0 ? (
            <EmptyState
              compact
              title={
                tab === "success"
                  ? t("auto_comment_no_data")
                  : t("auto_comment_no_errors")
              }
            />
          ) : (
            (tab === "success" ? successLogs : failLogs).map((l) => (
              <div
                key={l.id}
                className={cn(
                  "bm-flex bm-items-start bm-gap-2 bm-rounded-lg bm-border bm-px-2 bm-py-1.5 bm-text-[11.5px]",
                  tab === "success"
                    ? "bm-border-success/25 bm-bg-success-soft"
                    : "bm-border-danger/25 bm-bg-danger-soft"
                )}>
                {tab === "success" ? (
                  <CheckCircle2
                    size={12}
                    className="bm-mt-0.5 bm-shrink-0 bm-text-success"
                  />
                ) : (
                  <XCircle
                    size={12}
                    className="bm-mt-0.5 bm-shrink-0 bm-text-danger"
                  />
                )}
                <div className="bm-min-w-0 bm-flex-1 bm-break-words">
                  <span
                    className={cn(
                      "bm-font-medium",
                      tab === "success" ? "bm-text-success" : "bm-text-danger"
                    )}>
                    {l.groupName || t("auto_comment_bot_label")}
                  </span>
                  {tab === "success" ? (
                    l.commentPreview && (
                      <span className="bm-ml-1 bm-text-fg-muted">
                        — "{l.commentPreview}"
                      </span>
                    )
                  ) : (
                    <span className="bm-ml-1.5 bm-text-fg-muted">{l.msg}</span>
                  )}
                  <PostLink href={l.permalink} className="bm-text-info" />
                </div>
                <span className="bm-shrink-0 bm-text-fg-subtle">{l.ts}</span>
              </div>
            ))
          )}
        </div>
      )}

      <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2 bm-border-t bm-border-line bm-pt-2">
        {isRunning && (
          <Button
            size="sm"
            variant="outline"
            icon={<Pause size={14} />}
            onClick={onPause}>
            {t("auto_comment_pause")}
          </Button>
        )}
        {isPaused && (
          <Button
            size="sm"
            variant="primary"
            icon={<Play size={14} />}
            onClick={onResume}>
            {t("auto_comment_resume")}
          </Button>
        )}
        {isActive && (
          <Button
            size="sm"
            variant="danger"
            icon={<Square size={14} />}
            onClick={onStop}>
            {t("auto_comment_stop_bot")}
          </Button>
        )}
        {!isActive && (
          <Button
            size="sm"
            variant="outline"
            icon={<ChevronLeft size={14} />}
            onClick={onBack}>
            {t("auto_comment_back_to_dashboard")}
          </Button>
        )}
      </div>
    </div>
  )
}
