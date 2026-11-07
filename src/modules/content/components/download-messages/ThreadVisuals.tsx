import { MessageSquare, Users } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { MessageThread } from "src/modules/content/types/download-messages.types"
import { Avatar, Badge, cn } from "src/modules/shared/ui"

/** Thread picture, or a type icon when Facebook returns no image. */
export function ThreadAvatar({ thread, size = 36 }: { thread: MessageThread; size?: number }) {
  if (thread.image) return <Avatar src={thread.image} name={thread.name} size={size} />
  const iconSize = Math.round(size * 0.45)
  return (
    <span
      className={cn(
        "bm-inline-flex bm-shrink-0 bm-items-center bm-justify-center bm-rounded-full bm-bg-brand-soft bm-text-brand-ink",
        thread.threadType === "PAGE" && "bm-bg-success-soft bm-text-success"
      )}
      style={{ width: size, height: size }}>
      {thread.threadType === "ONE_TO_ONE" || thread.threadType === "PAGE" ? (
        <MessageSquare size={iconSize} />
      ) : (
        <Users size={iconSize} />
      )}
    </span>
  )
}

export function ThreadTypeBadge({ threadType }: { threadType: string }) {
  const { t } = useTranslation()
  if (threadType === "ONE_TO_ONE") {
    return (
      <Badge size="xs" tone="info">
        {t("download_messages_tool_type_personal")}
      </Badge>
    )
  }
  if (threadType === "PAGE") {
    return (
      <Badge size="xs" tone="success">
        {t("download_messages_tool_type_fanpage")}
      </Badge>
    )
  }
  return (
    <Badge size="xs" tone="violet">
      {t("download_messages_tool_type_group")}
    </Badge>
  )
}
