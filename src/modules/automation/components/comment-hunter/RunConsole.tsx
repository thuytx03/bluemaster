import { CheckCircle2, ExternalLink, ListChecks, Terminal } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import type {
  CkLogEntry,
  CkProgress,
  CkResult
} from "src/modules/automation/types/comment-hunter.types"
import {
  formatAbsoluteShort,
  truncate
} from "src/modules/automation/utils/comment-hunter.util"
import {
  Badge,
  cn,
  EmptyState,
  Progress,
  Segmented,
  Spinner
} from "src/modules/shared/ui"

const LOG_TONE: Record<CkLogEntry["type"], string> = {
  info: "bm-text-fg-muted",
  success: "bm-text-success",
  error: "bm-text-danger",
  warn: "bm-text-warning",
  countdown: "bm-font-medium bm-text-warning"
}

const VIEW_LINK =
  "bm-inline-flex bm-items-center bm-gap-0.5 bm-font-medium bm-text-brand-ink hover:bm-underline"

/** Progress bar + log console (progress / success tabs) of the source Step 2. */
export function RunConsole({
  isRunning,
  hasStarted,
  progress,
  logs,
  results
}: {
  isRunning: boolean
  hasStarted: boolean
  progress: CkProgress
  logs: CkLogEntry[]
  results: CkResult[]
}) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<"progress" | "success">("progress")
  const logBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll the log box itself (scrollIntoView would also scroll the Facebook page).
    const box = logBoxRef.current
    if (box) box.scrollTop = box.scrollHeight
  }, [logs.length, tab])

  if (!hasStarted) {
    return (
      <div className="bm-rounded-xl bm-border bm-border-dashed bm-border-line bm-bg-surface-2/30">
        <EmptyState
          compact
          icon={<Terminal size={18} />}
          title={t("comment_hunter_empty_console_hint")}
        />
      </div>
    )
  }

  const percent = progress.total ? (progress.current / progress.total) * 100 : 0

  return (
    <div className="bm-flex bm-flex-col bm-gap-2">
      <div className="bm-flex bm-flex-col bm-gap-2 bm-rounded-xl bm-border bm-border-line bm-bg-surface bm-p-2.5">
        <div className="bm-flex bm-items-center bm-gap-2">
          {isRunning ? (
            <Spinner size={16} />
          ) : (
            <CheckCircle2 size={16} className="bm-shrink-0 bm-text-success" />
          )}
          <Progress value={percent} className="bm-flex-1" />
          <span className="bm-font-mono bm-text-[12px] bm-font-semibold bm-text-fg">
            {progress.current}/{progress.total}
          </span>
        </div>
        <div className="bm-flex bm-flex-wrap bm-gap-1.5">
          <Badge tone="success">
            {t("comment_hunter_progress_success", { count: progress.done })}
          </Badge>
          <Badge tone="danger">
            {t("comment_hunter_progress_fail", { count: progress.fail })}
          </Badge>
        </div>
      </div>

      <div className="bm-flex bm-flex-col bm-overflow-hidden bm-rounded-xl bm-border bm-border-line bm-bg-surface">
        <div className="bm-border-b bm-border-line bm-p-1.5">
          <Segmented<"progress" | "success">
            block
            size="sm"
            value={tab}
            onChange={setTab}
            options={[
              {
                value: "progress",
                icon: <ListChecks size={13} />,
                label: t("comment_hunter_tab_progress")
              },
              {
                value: "success",
                icon: <CheckCircle2 size={13} />,
                label: `${t("comment_hunter_tab_success")} (${results.length})`
              }
            ]}
          />
        </div>

        {tab === "progress" ? (
          <div
            ref={logBoxRef}
            className="bm-max-h-[360px] bm-overflow-y-auto bm-bg-surface-2/40 bm-px-2.5 bm-py-1.5 bm-font-mono bm-text-[11.5px] bm-leading-relaxed">
            {logs.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "bm-break-words bm-border-b bm-border-line/60 bm-py-1 last:bm-border-b-0",
                  LOG_TONE[entry.type]
                )}>
                {entry.text}
                {entry.linkUrl && (
                  <>
                    {" "}
                    <a
                      href={entry.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={VIEW_LINK}>
                      {t("comment_hunter_link_view_post")}
                    </a>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bm-max-h-[360px] bm-overflow-y-auto">
            {results.map((r) => (
              <div
                key={r.order}
                className="bm-flex bm-items-start bm-gap-2.5 bm-border-b bm-border-line bm-px-2.5 bm-py-2 last:bm-border-b-0">
                <span className="bm-w-6 bm-shrink-0 bm-font-mono bm-text-[11.5px] bm-text-fg-subtle">
                  {String(r.order).padStart(2, "0")}.
                </span>
                <div className="bm-min-w-0 bm-flex-1">
                  <div className="bm-truncate bm-font-mono bm-text-[10.5px] bm-text-fg-subtle">
                    {formatAbsoluteShort(r.time)} · ID: {r.postId}
                  </div>
                  <div className="bm-line-clamp-2 bm-break-words bm-text-[12px] bm-text-fg">
                    {truncate(r.commentText, 80)}
                  </div>
                </div>
                <a
                  href={r.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(VIEW_LINK, "bm-shrink-0 bm-text-[11.5px]")}>
                  {t("comment_hunter_link_view_post")}
                  <ExternalLink size={11} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
