import {
  CheckCircle2,
  ExternalLink,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Square,
  XCircle
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import type {
  LogEntry,
  PostCampaignProgress,
  PostCampaignRunState
} from "src/modules/automation/types/post-campaign.types"
import {
  Button,
  Callout,
  cn,
  Progress,
  Segmented,
  Spinner,
  StatTile
} from "src/modules/shared/ui"

interface Props {
  campaignName: string
  runState: PostCampaignRunState
  progress: PostCampaignProgress
  logs: LogEntry[]
  countdown: number | null
  statusMsg: string
  error: string | null
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onNewCampaign: () => void
}

type LogTab = "log" | "success" | "fail"

export function Step4Running({
  campaignName,
  runState,
  progress,
  logs,
  countdown,
  statusMsg,
  error,
  onPause,
  onResume,
  onStop,
  onNewCampaign
}: Props) {
  const { t } = useTranslation()
  const isRunning = runState === "running"
  const isPaused = runState === "paused"
  const isDone = runState === "done"
  const [logTab, setLogTab] = useState<LogTab>("log")

  const successLogs = logs.filter(
    (l) => l.kind === "success" && l.postUrl !== undefined
  )
  const failLogs = logs.filter((l) => l.kind === "fail")
  const pct =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      <p className="bm-truncate bm-text-[14px] bm-font-bold bm-text-fg">
        {campaignName}
      </p>

      <div className="bm-flex bm-flex-col bm-gap-1.5">
        <div className="bm-flex bm-items-center bm-gap-2 bm-text-[12.5px]">
          {isRunning && <Spinner size={13} className="bm-text-brand" />}
          <span className="bm-font-medium bm-text-fg">
            {statusMsg ||
              (isDone
                ? t("campaign_manager_campaign_done")
                : t("campaign_manager_posting"))}
          </span>
        </div>
        <Progress
          value={pct}
          size="sm"
          tone={isDone ? "success" : "brand"}
          striped={isRunning}
        />
        <p className="bm-text-[12px] bm-text-fg-muted">
          {t("campaign_manager_group_progress", {
            current: progress.current,
            total: progress.total
          })}
        </p>
        {countdown !== null && countdown > 0 && (
          <Callout tone="warning" compact>
            {t("campaign_manager_estimated_remaining", {
              seconds: countdown
            })}
          </Callout>
        )}
      </div>

      <div className="bm-grid bm-grid-cols-3 bm-gap-2">
        <StatTile
          size="sm"
          tone="info"
          label={t("campaign_manager_stat_total")}
          value={progress.total}
        />
        <StatTile
          size="sm"
          tone="success"
          label={t("campaign_manager_stat_success")}
          value={progress.success}
        />
        <StatTile
          size="sm"
          tone="danger"
          label={t("campaign_manager_stat_fail")}
          value={progress.fail}
        />
      </div>

      <Segmented<LogTab>
        size="sm"
        block
        value={logTab}
        onChange={setLogTab}
        options={[
          {
            value: "log",
            label: t("campaign_manager_log_tab_progress"),
            icon: <Layers size={12} />
          },
          {
            value: "success",
            label: t("campaign_manager_log_tab_success_short", {
              count: successLogs.length
            }),
            icon: <CheckCircle2 size={12} />
          },
          {
            value: "fail",
            label: t("campaign_manager_log_tab_fail_short", {
              count: failLogs.length
            }),
            icon: <XCircle size={12} />
          }
        ]}
      />

      {logTab === "log" && (
        <div className="bm-max-h-[360px] bm-min-h-[160px] bm-overflow-y-auto bm-rounded-lg bm-bg-gray-950 bm-p-2 bm-font-mono bm-text-[11.5px] bm-text-gray-100">
          {logs.length === 0 && (
            <p className="bm-italic bm-text-gray-500">
              {t("campaign_manager_no_log_yet")}
            </p>
          )}
          {logs.map((log, i) => (
            <div
              key={i}
              className={cn(
                "bm-flex bm-items-start bm-gap-1.5 bm-py-0.5",
                log.kind === "success" && "bm-text-emerald-400",
                log.kind === "fail" && "bm-text-red-400",
                log.kind === "system" && "bm-text-yellow-400",
                log.kind === "posting" && "bm-text-gray-300"
              )}>
              <span className="bm-shrink-0">{log.icon}</span>
              <span className="bm-w-24 bm-shrink-0 bm-truncate bm-font-medium">
                {log.name}
              </span>
              <span className="bm-min-w-0 bm-flex-1 bm-break-words">
                {log.msg}
                {log.postUrl && (
                  <a
                    href={log.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bm-ml-2 bm-text-cyan-400 hover:bm-underline">
                    {t("campaign_manager_view_post")}
                  </a>
                )}
              </span>
              <span className="bm-shrink-0 bm-text-gray-500">[{log.ts}]</span>
            </div>
          ))}
        </div>
      )}

      {logTab === "success" && (
        <div className="bm-max-h-[360px] bm-overflow-y-auto">
          {successLogs.length === 0 ? (
            <p className="bm-py-6 bm-text-center bm-text-[12px] bm-italic bm-text-fg-muted">
              {t("campaign_manager_no_data")}
            </p>
          ) : (
            <table className="bm-w-full bm-text-[12px]">
              <thead>
                <tr className="bm-border-b bm-border-line bm-text-left bm-text-fg-muted">
                  <th className="bm-py-1 bm-pr-2">#</th>
                  <th className="bm-py-1 bm-pr-2">
                    {t("campaign_manager_table_group")}
                  </th>
                  <th className="bm-py-1 bm-pr-2">
                    {t("campaign_manager_table_time")}
                  </th>
                  <th className="bm-py-1">
                    {t("campaign_manager_table_link")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {successLogs.map((l, i) => (
                  <tr key={i} className="bm-border-b bm-border-line/50">
                    <td className="bm-py-1 bm-pr-2 bm-text-fg-muted">
                      {i + 1}
                    </td>
                    <td className="bm-max-w-[160px] bm-truncate bm-py-1 bm-pr-2 bm-font-medium bm-text-success">
                      {l.name}
                    </td>
                    <td className="bm-py-1 bm-pr-2 bm-text-fg-muted">{l.ts}</td>
                    <td className="bm-py-1">
                      {l.postUrl && (
                        <a
                          href={l.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bm-inline-flex bm-items-center bm-gap-1 bm-whitespace-nowrap bm-text-brand-ink hover:bm-underline">
                          <ExternalLink size={11} />{" "}
                          {t("campaign_manager_view_post")}
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {logTab === "fail" && (
        <div className="bm-flex bm-max-h-[360px] bm-flex-col bm-gap-1 bm-overflow-y-auto">
          {failLogs.length === 0 ? (
            <p className="bm-py-6 bm-text-center bm-text-[12px] bm-italic bm-text-fg-muted">
              {t("campaign_manager_no_errors")}
            </p>
          ) : (
            failLogs.map((l, i) => (
              <div
                key={i}
                className="bm-flex bm-items-start bm-gap-2 bm-rounded-lg bm-border bm-border-danger/25 bm-bg-danger-soft bm-px-2 bm-py-1.5 bm-text-[12px]">
                <XCircle
                  size={12}
                  className="bm-mt-0.5 bm-shrink-0 bm-text-danger"
                />
                <div className="bm-min-w-0">
                  <span className="bm-font-medium bm-text-danger">
                    {l.name}
                  </span>
                  <span className="bm-ml-2 bm-break-words bm-text-fg-muted">
                    {l.msg}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {error && (
        <Callout tone="danger" compact>
          {error}
        </Callout>
      )}

      <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2 bm-border-t bm-border-line bm-pt-3">
        {isRunning && (
          <Button
            variant="outline"
            size="sm"
            icon={<Pause size={13} />}
            onClick={onPause}>
            {t("campaign_manager_pause")}
          </Button>
        )}
        {isPaused && (
          <Button
            variant="primary"
            size="sm"
            icon={<Play size={13} />}
            onClick={onResume}>
            {t("campaign_manager_resume")}
          </Button>
        )}
        {(isRunning || isPaused) && (
          <Button
            variant="danger"
            size="sm"
            icon={<Square size={13} />}
            onClick={onStop}>
            {t("campaign_manager_stop_campaign")}
          </Button>
        )}
        {!isRunning && !isPaused && (
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw size={13} />}
            onClick={onNewCampaign}>
            {t("campaign_manager_new_campaign")}
          </Button>
        )}
      </div>
    </div>
  )
}
