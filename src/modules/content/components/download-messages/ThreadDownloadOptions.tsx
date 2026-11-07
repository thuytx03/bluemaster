import { Code, Download, FileText, Loader2, StopCircle, X } from "lucide-react"
import { forwardRef } from "react"
import { useTranslation } from "react-i18next"

import { ThreadAvatar } from "src/modules/content/components/download-messages/ThreadVisuals"
import type {
  DownloadMessagesFormat,
  DownloadProgress,
  MessageThread
} from "src/modules/content/types/download-messages.types"
import { Button, Field, IconButton, NumberInput, Progress, RadioGroup } from "src/modules/shared/ui"

const LIMIT_PRESETS = [50, 100, 200, 500, 1000, 5000]

interface ThreadDownloadOptionsProps {
  thread: MessageThread
  limit: number
  onLimitChange: (limit: number) => void
  format: DownloadMessagesFormat
  onFormatChange: (format: DownloadMessagesFormat) => void
  downloading: boolean
  progress: DownloadProgress
  onClose: () => void
  onStart: () => void
  onStop: () => void
}

/** Download configuration (limit + format) for the selected thread, then the running progress. */
export const ThreadDownloadOptions = forwardRef<HTMLDivElement, ThreadDownloadOptionsProps>(
  function ThreadDownloadOptions(
    { thread, limit, onLimitChange, format, onFormatChange, downloading, progress, onClose, onStart, onStop },
    ref
  ) {
    const { t } = useTranslation()
    const percent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

    return (
      <div
        ref={ref}
        className="bm-flex bm-flex-col bm-gap-3 bm-rounded-xl bm-border bm-border-brand/30 bm-bg-surface bm-p-3 bm-shadow-sm">
        <div className="bm-flex bm-items-center bm-gap-2.5 bm-border-b bm-border-line bm-pb-2.5">
          <ThreadAvatar thread={thread} size={36} />
          <div className="bm-min-w-0 bm-flex-1">
            <div className="bm-truncate bm-text-[13.5px] bm-font-semibold bm-text-fg">{thread.name}</div>
            <div className="bm-truncate bm-text-[11px] bm-text-fg-muted">
              {t("download_messages_tool_thread_id_label")}: <span className="bm-font-mono">{thread.id}</span> (
              {thread.threadType === "ONE_TO_ONE"
                ? t("download_messages_tool_thread_type_personal_suffix")
                : t("download_messages_tool_thread_type_group_suffix")}
              )
            </div>
          </div>
          <IconButton
            size="xs"
            label={t("download_messages_tool_action_cancel")}
            disabled={downloading}
            onClick={onClose}>
            <X size={14} />
          </IconButton>
        </div>

        {!downloading ? (
          <>
            <Field
              label={t("download_messages_tool_label_message_limit")}
              hint={t("download_messages_tool_hint_message_order")}>
              <NumberInput size="sm" value={limit} min={1} onChange={(v) => onLimitChange(v || 100)} />
              <div className="bm-flex bm-flex-wrap bm-gap-1.5">
                {LIMIT_PRESETS.map((val) => (
                  <Button
                    key={val}
                    size="xs"
                    variant={limit === val ? "primary" : "outline"}
                    className="bm-h-6 bm-px-2 bm-text-[11.5px]"
                    onClick={() => onLimitChange(val)}>
                    {val}
                  </Button>
                ))}
              </div>
            </Field>

            <Field label={t("download_messages_tool_label_export_format")}>
              <RadioGroup<DownloadMessagesFormat>
                variant="cards"
                columns={2}
                value={format}
                onChange={onFormatChange}
                options={[
                  {
                    value: "html",
                    icon: <Code size={15} className="bm-text-info" />,
                    label: t("download_messages_tool_format_html_title"),
                    description: t("download_messages_tool_format_html_description")
                  },
                  {
                    value: "txt",
                    icon: <FileText size={15} className="bm-text-success" />,
                    label: t("download_messages_tool_format_txt_title"),
                    description: t("download_messages_tool_format_txt_description")
                  }
                ]}
              />
            </Field>

            <div className="bm-flex bm-justify-end bm-gap-2">
              <Button size="sm" variant="outline" onClick={onClose}>
                {t("download_messages_tool_action_cancel")}
              </Button>
              <Button size="sm" variant="primary" icon={<Download size={14} />} onClick={onStart}>
                {t("download_messages_tool_action_start_download")}
              </Button>
            </div>
          </>
        ) : (
          <div className="bm-flex bm-flex-col bm-gap-3 bm-py-1">
            <div className="bm-flex bm-items-start bm-justify-between bm-gap-3">
              <div className="bm-min-w-0">
                <div className="bm-flex bm-items-center bm-gap-1.5 bm-text-[13px] bm-font-medium bm-text-fg">
                  <Loader2 size={14} className="bm-animate-spin bm-text-brand-ink" />
                  {t("download_messages_tool_downloading_title")}
                </div>
                <p className="bm-mt-0.5 bm-text-[11.5px] bm-text-fg-muted">
                  {t("download_messages_tool_downloading_hint")}
                </p>
              </div>
              <div className="bm-shrink-0 bm-text-right">
                <div className="bm-font-mono bm-text-[13px] bm-font-bold bm-text-brand-ink">
                  {progress.current} / {progress.total}
                </div>
                <div className="bm-text-[11px] bm-text-fg-muted">
                  {t("download_messages_tool_downloading_unit")}
                </div>
              </div>
            </div>
            <Progress value={percent} size="md" striped label />
            <div className="bm-flex bm-justify-center">
              <Button size="sm" variant="danger" icon={<StopCircle size={14} />} onClick={onStop}>
                {t("download_messages_tool_action_stop_download")}
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }
)
