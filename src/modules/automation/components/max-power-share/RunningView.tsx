import {
  CheckCircle2,
  Download,
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
  Square,
  XCircle
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import type {
  MaxPowerShareProgress,
  MaxPowerShareRunState,
  SelectedIdentityRow,
  ShareLog,
  ShareLogFilter
} from "src/modules/automation/types/max-power-share.types"
import {
  Badge,
  Button,
  Callout,
  EmptyState,
  Progress,
  Segmented,
  Spinner,
  StatTile,
  Surface
} from "src/modules/shared/ui"
import { exportToCSV } from "src/utils/export.util"

interface Props {
  runState: MaxPowerShareRunState
  progress: MaxPowerShareProgress
  logs: ShareLog[]
  countdown: number | null
  statusMsg: string
  identityRows: SelectedIdentityRow[]
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onReset: () => void
}

export function RunningView({
  runState,
  progress,
  logs,
  countdown,
  statusMsg,
  identityRows,
  onPause,
  onResume,
  onStop,
  onReset
}: Props) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<ShareLogFilter>("all")

  const isRunning = runState === "running"
  const isPaused = runState === "paused"
  const isDone = runState === "done"

  const successLogs = logs.filter((l) => l.ok)
  const failLogs = logs.filter((l) => !l.ok)
  const tabLogs =
    tab === "success" ? successLogs : tab === "fail" ? failLogs : logs

  const currentIdentityLabel =
    identityRows.length > 0 ? identityRows[0].identity.name : ""
  const pct =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0

  const handleExport = () => {
    exportToCSV(
      [
        t("max_power_share_table_ordinal"),
        t("max_power_share_table_identity"),
        t("max_power_share_table_time"),
        "Group ID",
        t("max_power_share_table_group_target"),
        t("max_power_share_table_result"),
        "Message",
        t("max_power_share_table_post")
      ],
      tabLogs.map((l, i) => [
        i + 1,
        l.identityName,
        l.ts,
        l.groupId,
        l.groupName,
        l.ok ? "OK" : "FAIL",
        l.msg,
        l.postUrl
      ]),
      `max-power-share-${tab}-${Date.now()}`
    )
  }

  const tabLabel = (label: string, count: number, active: boolean) => (
    <span className="bm-inline-flex bm-items-center bm-gap-1">
      {label}
      <Badge size="xs" tone={active ? "brand" : "neutral"}>
        {count}
      </Badge>
    </span>
  )

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      <Surface
        padding="sm"
        icon={
          isDone ? (
            <CheckCircle2 size={15} className="bm-text-success" />
          ) : (
            <Spinner size={14} />
          )
        }
        title={
          isDone
            ? t("max_power_share_status_done")
            : isPaused
              ? t("max_power_share_status_paused")
              : t("max_power_share_status_sharing")
        }
        extra={
          <span className="bm-text-[16px] bm-font-bold bm-tabular-nums bm-text-brand-ink">
            {pct}%
          </span>
        }
        bodyClassName="bm-flex bm-flex-col bm-gap-2">
        <div className="bm-text-[12px] bm-text-fg-muted">
          {currentIdentityLabel} → {t("max_power_share_label_group")} ·{" "}
          {statusMsg || (isDone ? t("max_power_share_status_done") : "...")}
        </div>
        <Progress
          value={pct}
          size="md"
          tone={isDone ? "success" : "brand"}
          striped={isRunning}
        />
        <div className="bm-flex bm-flex-wrap bm-items-center bm-justify-between bm-gap-x-3 bm-gap-y-0.5 bm-text-[12px] bm-text-fg-muted">
          <span>
            <strong className="bm-text-fg">
              {progress.current} / {progress.total}
            </strong>{" "}
            {t("max_power_share_unit_turns")}
            {!isDone && progress.current < progress.total && (
              <>
                {" · "}
                {t("max_power_share_turn_posting", {
                  current: progress.current + 1,
                  total: progress.total
                })}
              </>
            )}
          </span>
          <span>
            {t("max_power_share_label_eta_remaining")}{" "}
            {countdown !== null && countdown > 0 ? (
              <span className="bm-font-medium bm-text-warning">
                {countdown}s
              </span>
            ) : (
              <span className="bm-font-bold bm-text-brand-ink">—</span>
            )}
          </span>
        </div>
      </Surface>

      <div className="bm-grid bm-grid-cols-2 bm-gap-2">
        <StatTile
          size="sm"
          tone="success"
          icon={<CheckCircle2 size={15} />}
          label={t("max_power_share_tab_success")}
          value={progress.success}
        />
        <StatTile
          size="sm"
          tone="danger"
          icon={<XCircle size={15} />}
          label={t("max_power_share_tab_fail")}
          value={progress.fail}
        />
      </div>

      <div className="bm-flex bm-items-center bm-justify-between bm-gap-2">
        <Segmented<ShareLogFilter>
          size="sm"
          value={tab}
          onChange={setTab}
          options={[
            {
              value: "all",
              label: tabLabel(
                t("max_power_share_tab_progress"),
                logs.length,
                tab === "all"
              )
            },
            {
              value: "success",
              label: tabLabel(
                t("max_power_share_tab_success"),
                successLogs.length,
                tab === "success"
              )
            },
            {
              value: "fail",
              label: tabLabel(
                t("max_power_share_tab_fail"),
                failLogs.length,
                tab === "fail"
              )
            }
          ]}
        />
        <Button
          size="xs"
          variant="outline"
          icon={<Download size={13} />}
          onClick={handleExport}
          disabled={tabLogs.length === 0}>
          CSV
        </Button>
      </div>

      <div className="bm-max-h-[360px] bm-overflow-y-auto bm-rounded-xl bm-border bm-border-line">
        {tabLogs.length === 0 ? (
          <EmptyState compact title={t("max_power_share_no_data")} />
        ) : (
          <ul className="bm-divide-y bm-divide-line">
            {tabLogs.map((log, i) => (
              <li
                key={i}
                className={
                  log.ok ? "bm-bg-success-soft/40" : "bm-bg-danger-soft/40"
                }>
                <div className="bm-flex bm-items-start bm-gap-2 bm-px-2.5 bm-py-2">
                  <span className="bm-w-5 bm-shrink-0 bm-pt-0.5 bm-text-[11px] bm-tabular-nums bm-text-fg-subtle">
                    {i + 1}
                  </span>
                  {log.ok ? (
                    <CheckCircle2
                      size={15}
                      className="bm-mt-0.5 bm-shrink-0 bm-text-success"
                    />
                  ) : (
                    <XCircle
                      size={15}
                      className="bm-mt-0.5 bm-shrink-0 bm-text-danger"
                    />
                  )}
                  <div className="bm-min-w-0 bm-flex-1">
                    <div className="bm-truncate bm-text-[12.5px] bm-font-medium bm-text-fg">
                      {log.groupName || log.groupId}
                    </div>
                    <div className="bm-truncate bm-text-[11px] bm-text-fg-subtle">
                      <span className="bm-font-semibold bm-text-brand-ink">
                        {log.identityName || "—"}
                      </span>{" "}
                      · {log.ts}
                    </div>
                    {!log.ok && (
                      <div className="bm-break-words bm-text-[11.5px] bm-text-danger">
                        {log.msg}
                      </div>
                    )}
                  </div>
                  {log.postUrl ? (
                    <a
                      href={log.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bm-inline-flex bm-shrink-0 bm-items-center bm-gap-1 bm-rounded-md bm-border bm-border-brand/50 bm-px-1.5 bm-py-0.5 bm-text-[11.5px] bm-text-brand-ink hover:bm-bg-brand-soft">
                      <ExternalLink size={11} />{" "}
                      {t("max_power_share_button_open")}
                    </a>
                  ) : (
                    <span className="bm-shrink-0 bm-text-fg-subtle">—</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Callout tone="info" compact>
        {t("max_power_share_pending_review_notice")}
      </Callout>

      <div className="bm-sticky bm-bottom-0 bm-flex bm-flex-wrap bm-items-center bm-gap-2 bm-border-t bm-border-line bm-bg-surface bm-py-2.5">
        {isRunning && (
          <Button
            size="sm"
            variant="outline"
            icon={<Pause size={14} />}
            onClick={onPause}>
            {t("max_power_share_button_pause")}
          </Button>
        )}
        {isPaused && (
          <Button
            size="sm"
            variant="outline"
            icon={<Play size={14} />}
            onClick={onResume}>
            {t("max_power_share_button_resume")}
          </Button>
        )}
        {!isDone && (
          <Button
            size="sm"
            variant="danger"
            icon={<Square size={14} />}
            onClick={onStop}>
            {t("max_power_share_button_finish")}
          </Button>
        )}
        {isDone && (
          <Button
            size="sm"
            variant="outline"
            icon={<RotateCcw size={14} />}
            onClick={onReset}>
            {t("max_power_share_button_reset")}
          </Button>
        )}
      </div>
    </div>
  )
}
