import { ExternalLink, ImageIcon } from "lucide-react"
import type { MouseEvent } from "react"
import { useTranslation } from "react-i18next"

import type { CkPost } from "src/modules/automation/types/comment-hunter.types"
import {
  formatAbsoluteShort,
  formatRelativeTime,
  postCategory,
  postLink
} from "src/modules/automation/utils/comment-hunter.util"
import { Badge, Checkbox, cn } from "src/modules/shared/ui"

const LINK = "bm-font-medium bm-text-brand-ink hover:bm-underline"

/** One search result: the source table row laid out as a compact card for the narrow sidebar. */
export function PostRow({
  post: p,
  selected,
  onToggle
}: {
  post: CkPost
  selected: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const isGroup = postCategory(p) === "group"
  const stop = (e: MouseEvent) => e.stopPropagation()

  return (
    <div
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a,button,label")) return
        onToggle()
      }}
      className={cn(
        "bm-flex bm-cursor-pointer bm-items-start bm-gap-2.5 bm-border-t bm-border-line bm-px-2.5 bm-py-2 bm-transition-colors first:bm-border-t-0 hover:bm-bg-surface-2/60",
        selected && "bm-bg-brand-soft/40 hover:bm-bg-brand-soft/60"
      )}>
      <Checkbox checked={selected} onChange={onToggle} className="bm-mt-0.5" />

      {p.imageUrl ? (
        <img
          src={p.imageUrl}
          alt=""
          className="bm-h-12 bm-w-12 bm-shrink-0 bm-rounded-lg bm-border bm-border-line bm-object-cover"
        />
      ) : (
        <div className="bm-flex bm-h-12 bm-w-12 bm-shrink-0 bm-items-center bm-justify-center bm-rounded-lg bm-border bm-border-line bm-bg-surface-2 bm-text-fg-subtle">
          <ImageIcon size={16} />
        </div>
      )}

      <div className="bm-flex bm-min-w-0 bm-flex-1 bm-flex-col bm-gap-1">
        {p.messageText ? (
          <div className="bm-line-clamp-3 bm-break-words bm-text-[12.5px] bm-leading-snug bm-text-fg">
            {p.messageText.slice(0, 250)}
            {p.messageText.length > 250 ? "…" : ""}
          </div>
        ) : (
          <em className="bm-text-[12px] bm-text-fg-subtle">
            {t("comment_hunter_no_content")}
          </em>
        )}

        <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-x-2 bm-gap-y-1 bm-text-[11.5px] bm-text-fg-muted">
          <Badge size="xs" tone={isGroup ? "info" : "violet"}>
            {isGroup
              ? t("comment_hunter_category_group")
              : t("comment_hunter_category_page")}
          </Badge>
          <span
            className="bm-whitespace-nowrap"
            title={formatAbsoluteShort(p.creationTime)}>
            {formatRelativeTime(p.creationTime, t)}
          </span>
          <span className="bm-min-w-0 bm-max-w-full bm-truncate">
            {isGroup ? (
              <a
                href={"https://www.facebook.com/groups/" + p.groupId}
                target="_blank"
                rel="noopener noreferrer"
                onClick={stop}
                className={LINK}>
                {p.groupName || p.authorName || "—"}
              </a>
            ) : p.authorProfileUrl ? (
              <a
                href={p.authorProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={stop}
                className={LINK}>
                {p.authorName || "—"}
              </a>
            ) : (
              <span className="bm-text-fg">{p.authorName || "—"}</span>
            )}
          </span>
        </div>
      </div>

      <a
        href={postLink(p)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={stop}
        className="bm-inline-flex bm-h-7 bm-shrink-0 bm-items-center bm-gap-1 bm-rounded-lg bm-border bm-border-line-strong bm-bg-surface bm-px-2 bm-text-[11.5px] bm-font-medium bm-text-fg hover:bm-bg-surface-2 hover:bm-no-underline">
        <ExternalLink size={12} />
        {t("comment_hunter_button_view")}
      </a>
    </div>
  )
}
