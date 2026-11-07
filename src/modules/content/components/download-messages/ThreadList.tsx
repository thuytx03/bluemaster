import { Download } from "lucide-react"
import { useTranslation } from "react-i18next"

import { ThreadAvatar, ThreadTypeBadge } from "src/modules/content/components/download-messages/ThreadVisuals"
import type { MessageThread } from "src/modules/content/types/download-messages.types"
import { cn, IconButton } from "src/modules/shared/ui"

interface ThreadListProps {
  threads: MessageThread[]
  activeThreadId?: string
  disabled: boolean
  onSelect: (thread: MessageThread) => void
}

export function ThreadList({ threads, activeThreadId, disabled, onSelect }: ThreadListProps) {
  const { t } = useTranslation()

  return (
    <div className="bm-overflow-hidden bm-rounded-xl bm-border bm-border-line bm-bg-surface">
      <div className="bm-flex bm-items-center bm-gap-2 bm-border-b bm-border-line bm-bg-surface-2 bm-px-3 bm-py-2 bm-text-[11px] bm-font-semibold bm-uppercase bm-tracking-wide bm-text-fg-muted">
        <span className="bm-flex-1">{t("download_messages_tool_table_header_conversation")}</span>
        <span className="bm-w-16 bm-text-right">{t("download_messages_tool_table_header_message_count")}</span>
        <span className="bm-w-8 bm-text-center">{t("download_messages_tool_table_header_action")}</span>
      </div>
      <ul className="bm-divide-y bm-divide-line">
        {threads.map((thread) => (
          <li
            key={thread.id}
            className={cn(
              "bm-flex bm-items-center bm-gap-2 bm-px-3 bm-py-2 bm-transition-colors hover:bm-bg-surface-2",
              activeThreadId === thread.id && "bm-bg-brand-soft/50 hover:bm-bg-brand-soft/70"
            )}>
            <ThreadAvatar thread={thread} size={36} />
            <div className="bm-flex bm-min-w-0 bm-flex-1 bm-flex-col bm-gap-0.5">
              <span className="bm-truncate bm-text-[13px] bm-font-semibold bm-text-fg" title={thread.name ?? ""}>
                {thread.name}
              </span>
              <div className="bm-flex bm-min-w-0 bm-items-center bm-gap-1.5 bm-text-[11px] bm-text-fg-muted">
                <ThreadTypeBadge threadType={thread.threadType} />
                <span className="bm-truncate">
                  {t("download_messages_tool_thread_id_label")}:{" "}
                  <span className="bm-font-mono">{thread.id}</span>
                </span>
                <span>•</span>
                <span className="bm-shrink-0">
                  {thread.participants.length + 1} {t("download_messages_tool_member_count_suffix")}
                </span>
              </div>
            </div>
            <span className="bm-w-16 bm-text-right bm-text-[12.5px] bm-font-medium bm-tabular-nums bm-text-fg">
              {thread.messagesCount.toLocaleString("vi-VN")}
            </span>
            <IconButton
              size="sm"
              variant="outline"
              className="bm-w-8"
              disabled={disabled}
              label={t("download_messages_tool_action_download")}
              onClick={() => onSelect(thread)}>
              <Download size={13} />
            </IconButton>
          </li>
        ))}
      </ul>
    </div>
  )
}
