import { CheckCircle2, ListTodo, Loader2, RotateCcw, Trash2, XCircle } from "lucide-react"
import { ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { PROCESS_TEXT } from "src/constants/app.constants"
import { TProcessStatus } from "src/modules/download/types/download.types"
import {
  Badge,
  Button,
  DataColumn,
  DataTable,
  SectionLabel,
  TBadgeTone
} from "src/modules/shared/ui"

const TYPE_TONE: Record<string, TBadgeTone> = {
  PHOTO: "cyan",
  VIDEO: "danger",
  REEL: "success",
  HIGHLIGHT: "amber",
  STORY: "violet",
  FACEBOOK_POST_MEDIA: "info",
  FACEBOOK_VIDEO: "danger",
  FACEBOOK_HIGHLIGHT_STORY: "violet",
  FACEBOOK_ALBUM_MEDIA: "lime",
  FACEBOOK_COMMENT_VIDEO: "pink"
}

const STATUS_TONE: Record<TProcessStatus, TBadgeTone> = {
  RUNNING: "info",
  COMPLETED: "success",
  FAILED: "danger"
}

const STATUS_ICON: Record<TProcessStatus, JSX.Element> = {
  RUNNING: <Loader2 size={11} className="bm-animate-spin" />,
  COMPLETED: <CheckCircle2 size={11} />,
  FAILED: <XCircle size={11} />
}

export interface IProcessRow {
  id: string
  username: string
  downloadType: string
  totalDownloadedItems: number
  totalItems?: number
  skippedItems?: number
  filterRangeDate?: string | null
  status: TProcessStatus
}

interface DownloadProcessTableProps<T extends IProcessRow> {
  processes: T[]
  onCancel: (processId: string) => void
  /** Shown for FAILED rows */
  onRetry?: (processId: string) => void
  onClearFinished?: () => void
  /** Column header for the target (username / id) */
  targetLabel?: ReactNode
  /** Map a raw downloadType to a readable label */
  typeLabel?: (type: T["downloadType"]) => ReactNode
  showSkipped?: boolean
  showFilterDate?: boolean
}

function DownloadProcessTable<T extends IProcessRow>({
  processes,
  onCancel,
  onRetry,
  onClearFinished,
  targetLabel,
  typeLabel,
  showSkipped,
  showFilterDate
}: DownloadProcessTableProps<T>) {
  const { t } = useTranslation()
  const running = processes.filter((p) => p.status === "RUNNING").length
  const finished = processes.length - running

  const columns = useMemo<DataColumn<T>[]>(() => {
    const cols: DataColumn<T>[] = [
      {
        key: "ordinal",
        title: t("ordinal_number"),
        width: 44,
        align: "center",
        render: (_, i) => <span className="bm-text-fg-subtle">{i + 1}</span>
      },
      {
        key: "type",
        title: t("download_type"),
        render: (r) => (
          <Badge tone={TYPE_TONE[r.downloadType] ?? "neutral"} size="xs">
            {typeLabel ? typeLabel(r.downloadType) : r.downloadType}
          </Badge>
        )
      },
      {
        key: "target",
        title: targetLabel ?? t("id"),
        render: (r) => (
          <span
            className="bm-block bm-max-w-[180px] bm-truncate bm-font-semibold bm-text-brand-ink"
            title={r.username}>
            {r.username}
          </span>
        )
      }
    ]
    if (showFilterDate) {
      cols.push({
        key: "filterDate",
        title: t("date_range"),
        render: (r) => (
          <span className="bm-whitespace-nowrap bm-text-fg-muted">{r.filterRangeDate || "—"}</span>
        )
      })
    }
    cols.push({
      key: "count",
      title: t("downloaded_count"),
      align: "right",
      render: (r) => (
        <span className="bm-font-semibold bm-tabular-nums">
          {r.totalItems && r.totalItems > 0
            ? `${r.totalDownloadedItems}/${r.totalItems}`
            : r.totalDownloadedItems}
        </span>
      )
    })
    if (showSkipped) {
      cols.push({
        key: "skipped",
        title: t("skipped_count"),
        align: "right",
        render: (r) => (
          <span className="bm-tabular-nums bm-text-fg-muted">{r.skippedItems ?? 0}</span>
        )
      })
    }
    cols.push(
      {
        key: "status",
        title: t("status"),
        render: (r) => (
          <Badge tone={STATUS_TONE[r.status]} size="xs" icon={STATUS_ICON[r.status]}>
            {t(PROCESS_TEXT[r.status])}
          </Badge>
        )
      },
      {
        key: "action",
        title: t("action"),
        align: "right",
        render: (r) =>
          r.status === "RUNNING" ? (
            <Button size="xs" variant="danger" onClick={() => onCancel(r.id)}>
              {t("cancel")}
            </Button>
          ) : r.status === "FAILED" && onRetry ? (
            <Button size="xs" variant="outline" icon={<RotateCcw size={11} />} onClick={() => onRetry(r.id)}>
              {t("try_again")}
            </Button>
          ) : null
      }
    )
    return cols
  }, [t, onCancel, onRetry, targetLabel, typeLabel, showSkipped, showFilterDate])

  return (
    <div>
      <SectionLabel
        hint={
          <span className="bm-flex bm-items-center bm-gap-2">
            {running > 0 && (
              <Badge tone="info" size="xs" dot pulse>
                {running} {t("running_text").toLowerCase()}
              </Badge>
            )}
            {onClearFinished && finished > 0 && (
              <Button size="xs" variant="ghost" icon={<Trash2 size={11} />} onClick={onClearFinished}>
                {t("clear_finished")}
              </Button>
            )}
          </span>
        }>
        {t("processes")}
      </SectionLabel>
      <DataTable
        columns={columns}
        rows={processes}
        rowKey={(r) => r.id}
        pageSize={5}
        dense
        emptyIcon={<ListTodo size={20} />}
        emptyTitle={t("no_processes")}
        emptyDescription={t("no_processes_desc")}
      />
    </div>
  )
}

export default DownloadProcessTable
