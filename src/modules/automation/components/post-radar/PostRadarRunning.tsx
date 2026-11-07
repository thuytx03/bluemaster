import { ArrowLeft, Check, Square } from "lucide-react"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

import {
  PostRadarStepIndicator,
  PostTypeBadge
} from "src/modules/automation/components/post-radar/PostRadarParts"
import type { PostRadarController } from "src/modules/automation/hooks/usePostRadar"
import {
  Badge,
  Button,
  cn,
  Progress,
  Spinner,
  Surface
} from "src/modules/shared/ui"

/** Step 3: progress bar, live log and per-group results. */
export default function PostRadarRunning({
  scanner,
  onBack
}: {
  scanner: PostRadarController
  onBack: () => void
}) {
  const { t } = useTranslation()
  const { state, logs, results, progress, stop, posts } = scanner
  const isRunning = state === "running"
  const isDone = state === "done"
  const pct =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0
  const logBoxRef = useRef<HTMLDivElement>(null)

  // Scroll the log box only (scrollIntoView would also scroll the Facebook page)
  useEffect(() => {
    const el = logBoxRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [logs.length])

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      <div className="bm-flex bm-items-center bm-gap-2">
        <div className="bm-min-w-0 bm-flex-1">
          <PostRadarStepIndicator
            current={3}
            onBack={onBack}
            backDisabled={isRunning}
          />
        </div>
        {isRunning && (
          <Button
            size="sm"
            variant="danger"
            onClick={stop}
            icon={<Square size={12} />}>
            {t("post_radar_stop")}
          </Button>
        )}
        {isDone && (
          <Button
            size="sm"
            variant="outline"
            onClick={onBack}
            icon={<ArrowLeft size={13} />}>
            {t("back")}
          </Button>
        )}
      </div>

      {/* Progress */}
      <Surface padding="sm" bodyClassName="bm-flex bm-flex-col bm-gap-2">
        <div className="bm-flex bm-items-center bm-gap-2.5">
          {isRunning ? (
            <Spinner size={16} className="bm-shrink-0 bm-text-brand" />
          ) : isDone ? (
            <span className="bm-inline-flex bm-h-4 bm-w-4 bm-shrink-0 bm-items-center bm-justify-center bm-rounded-full bm-bg-success bm-text-white">
              <Check size={11} strokeWidth={3} />
            </span>
          ) : (
            <span className="bm-inline-flex bm-h-4 bm-w-4 bm-shrink-0 bm-items-center bm-justify-center bm-rounded-full bm-bg-surface-2 bm-text-[10px] bm-text-fg-muted">
              –
            </span>
          )}
          <Progress
            className="bm-flex-1"
            value={pct}
            size="md"
            tone={isDone ? "success" : "brand"}
            striped={isRunning}
          />
          <span className="bm-whitespace-nowrap bm-text-[12px] bm-font-semibold bm-text-fg">
            {isDone
              ? t("post_radar_progress_done", { pct })
              : isRunning
                ? t("post_radar_progress_running", { pct })
                : t("post_radar_progress_ready")}
          </span>
        </div>
        <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-x-4 bm-gap-y-1 bm-text-[12px]">
          <span className="bm-text-fg-muted">
            {t("post_radar_progress_count", {
              current: progress.current,
              total: progress.total
            })}
          </span>
          <span className="bm-font-semibold bm-text-success">
            {t("post_radar_progress_success", { count: progress.done })}
          </span>
          <span className="bm-font-semibold bm-text-danger">
            {t("post_radar_progress_fail", { count: progress.fail })}
          </span>
        </div>
      </Surface>

      {/* Log */}
      <Surface padding="none" title={t("post_radar_progress_panel_title")}>
        <div
          ref={logBoxRef}
          className="bm-h-[220px] bm-overflow-y-auto bm-rounded-b-xl bm-bg-gray-950 bm-p-3 bm-font-mono bm-text-[11.5px] bm-leading-relaxed bm-text-gray-300">
          {logs.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "bm-break-words bm-py-0.5",
                entry.type === "error" && "bm-text-red-400",
                entry.type === "success" && "bm-text-green-400",
                entry.type === "warn" && "bm-text-amber-300",
                entry.type === "countdown" &&
                  "bm-font-medium bm-text-amber-300",
                entry.type === "info" && "bm-text-gray-300"
              )}>
              {entry.text}
              {entry.linkUrl && (
                <>
                  {" "}
                  <a
                    href={entry.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bm-text-cyan-400 hover:bm-underline">
                    {t("post_radar_view_post")}
                  </a>
                </>
              )}
            </div>
          ))}
        </div>
      </Surface>

      {/* Results */}
      <Surface padding="none" title={t("post_radar_results_panel_title")}>
        {results.length === 0 ? (
          <p className="bm-py-8 bm-text-center bm-text-[12px] bm-italic bm-text-fg-muted">
            {t("post_radar_no_results")}
          </p>
        ) : (
          <div className="bm-max-h-[320px] bm-overflow-auto">
            <table className="bm-w-full bm-border-collapse bm-text-[12px] bm-text-fg">
              <thead>
                <tr className="bm-sticky bm-top-0 bm-bg-surface bm-text-left bm-text-[11px] bm-text-fg-muted">
                  <th className="bm-w-8 bm-px-2 bm-py-2 bm-font-semibold">
                    {t("post_radar_col_no")}
                  </th>
                  <th className="bm-px-2 bm-py-2 bm-font-semibold">
                    {t("post_radar_col_content")}
                  </th>
                  <th className="bm-px-2 bm-py-2 bm-font-semibold">
                    {t("post_radar_col_group")}
                  </th>
                  <th className="bm-w-14 bm-px-2 bm-py-2 bm-font-semibold">
                    {t("post_radar_col_status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const post = posts.find((p) => p.postId === r.postId)
                  return (
                    <tr
                      key={r.order}
                      className="bm-border-t bm-border-line bm-align-top hover:bm-bg-surface-2/60">
                      <td className="bm-px-2 bm-py-1.5 bm-text-fg-muted">
                        {r.order}
                      </td>
                      <td className="bm-max-w-[160px] bm-px-2 bm-py-1.5">
                        {post && (
                          <div className="bm-mb-0.5">
                            <PostTypeBadge postType={post.postType} />
                          </div>
                        )}
                        <a
                          href={r.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bm-line-clamp-2 bm-break-words bm-text-brand-ink hover:bm-underline">
                          {post?.message
                            ? post.message.slice(0, 60) +
                              (post.message.length > 60 ? "…" : "")
                            : r.postId}
                        </a>
                      </td>
                      <td className="bm-max-w-[120px] bm-truncate bm-px-2 bm-py-1.5 bm-text-brand-ink">
                        {r.groupName}
                      </td>
                      <td className="bm-px-2 bm-py-1.5" title={r.note}>
                        {r.status === "ok" ? (
                          <Badge size="xs" tone="success">
                            ✓ {t("post_radar_status_ok")}
                          </Badge>
                        ) : (
                          <Badge size="xs" tone="danger">
                            ✗ {t("post_radar_status_error")}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
    </div>
  )
}
