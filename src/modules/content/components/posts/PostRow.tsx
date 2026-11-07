import type { TFunction } from "i18next"
import { Archive, ExternalLink, EyeOff, FileText, Globe, Loader2, Lock, MoreHorizontal, Trash, Trash2, Users, UserX } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import type { Post, PostAction, PostType } from "src/modules/content/types/posts.types"
import { formatPostDate, truncatePostText } from "src/modules/content/utils/posts.util"
import { Badge, Checkbox, cn, Dropdown, IconButton } from "src/modules/shared/ui"
import type { DropdownItem, TBadgeTone } from "src/modules/shared/ui"

export const TH = "bm-px-2 bm-py-2 bm-text-left bm-text-[11px] bm-font-semibold bm-text-fg-muted bm-whitespace-nowrap"
export const TD = "bm-px-2 bm-py-2 bm-align-top"

/** Verb used in confirm titles, toasts and the bulk progress chip. */
export function getActionLabel(t: TFunction, type?: PostAction | string): string {
  switch (type) {
    case "delete":
      return t("posts_action_delete")
    case "hide":
      return t("posts_action_hide")
    case "untag":
      return t("posts_action_untag")
    case "archive":
      return t("posts_action_archive")
    case "trash":
      return t("posts_action_trash")
    default:
      return t("posts_action_process")
  }
}

/** Content of the type / privacy filters (labels match the source selects). */
export function getTypeOptionLabel(t: TFunction, type: PostType): string {
  if (type === "share") return t("posts_type_share")
  if (type === "tagged") return t("posts_type_tagged_full")
  return t("posts_type_own")
}

const TYPE_TONE: Record<PostType, TBadgeTone> = {
  share: "violet",
  own: "success",
  tagged: "info"
}

/** Label shown in the row badge: the source stored `typeLabel` (short "tagged" label). */
function typeBadgeLabel(t: TFunction, type: PostType): string {
  if (type === "share") return t("posts_type_share")
  if (type === "tagged") return t("posts_type_tagged")
  return t("posts_type_own")
}

export function getPrivacyConfig(t: TFunction, privacy: string): { label: string; icon: ReactNode; tone: TBadgeTone } {
  switch (privacy) {
    case "EVERYONE":
      return { label: t("posts_privacy_everyone"), icon: <Globe size={11} />, tone: "info" }
    case "FRIENDS":
      return { label: t("posts_privacy_friends"), icon: <Users size={11} />, tone: "success" }
    case "ONLY_ME":
      return { label: t("posts_privacy_only_me"), icon: <Lock size={11} />, tone: "amber" }
    case "CUSTOM":
      return { label: t("posts_privacy_custom"), icon: <Users size={11} />, tone: "violet" }
    default:
      return { label: privacy, icon: <Globe size={11} />, tone: "neutral" }
  }
}

/** Action menu items; destructive "delete permanently" sits under a divider and needs `canDelete`. */
export function getPostActionItems(
  t: TFunction,
  onAction: (type: PostAction) => void,
  { full, canDelete = true }: { full: boolean; canDelete?: boolean }
): DropdownItem[] {
  return [
    {
      key: "hide",
      icon: <EyeOff size={14} className="bm-text-warning" />,
      label: full ? t("posts_menu_hide_timeline_full") : t("posts_menu_hide_timeline"),
      onClick: () => onAction("hide")
    },
    {
      key: "untag",
      icon: <UserX size={14} className="bm-text-violet-600 dark:bm-text-violet-400" />,
      label: full ? t("posts_menu_untag_timeline_full") : t("posts_menu_untag_timeline"),
      onClick: () => onAction("untag")
    },
    {
      key: "archive",
      icon: <Archive size={14} className="bm-text-info" />,
      label: t("posts_menu_archive"),
      onClick: () => onAction("archive")
    },
    {
      key: "trash",
      icon: full ? <Trash size={14} className="bm-text-orange-500" /> : <Trash2 size={14} className="bm-text-orange-500" />,
      label: t("posts_menu_trash"),
      onClick: () => onAction("trash")
    },
    {
      key: "delete",
      icon: <Trash2 size={14} />,
      label: t("posts_menu_delete_permanent"),
      danger: true,
      divider: true,
      disabled: !canDelete,
      onClick: () => onAction("delete")
    }
  ]
}

interface PostRowProps {
  post: Post
  index: number
  selected: boolean
  processing: boolean
  processed?: "success" | "error"
  bulkRunning: boolean
  onToggle: () => void
  onAction: (type: PostAction) => void
}

/**
 * One table row. The source's separate type / privacy / date columns are folded
 * under the content so the table fits the narrow sidebar.
 */
export function PostRow({ post, index, selected, processing, processed, bulkRunning, onToggle, onAction }: PostRowProps) {
  const { t } = useTranslation()
  const privConfig = getPrivacyConfig(t, post.privacy)
  const imageUri = post.attachments[0]?.imageUri

  return (
    <tr
      className={cn(
        "bm-border-t bm-border-line bm-transition-colors hover:bm-bg-surface-2/60",
        selected && "bm-bg-brand-soft/40 hover:bm-bg-brand-soft/60",
        processed === "success" && "bm-opacity-40"
      )}>
      <td className={cn(TD, "bm-w-8 bm-text-center")}>
        <Checkbox checked={selected} onChange={onToggle} disabled={!!processed} size="sm" />
      </td>
      <td className={cn(TD, "bm-w-8 bm-text-center bm-font-mono bm-text-[11px] bm-text-fg-subtle")}>{index}</td>
      <td className={TD}>
        <div className="bm-flex bm-items-start bm-gap-2.5">
          {imageUri ? (
            <img
              src={imageUri}
              alt="thumbnail"
              className="bm-h-11 bm-w-11 bm-shrink-0 bm-rounded-lg bm-border bm-border-line bm-bg-surface-2 bm-object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = "none"
              }}
            />
          ) : (
            <div className="bm-flex bm-h-11 bm-w-11 bm-shrink-0 bm-items-center bm-justify-center bm-rounded-lg bm-border bm-border-line bm-bg-surface-2/60">
              <FileText size={18} className="bm-text-fg-subtle" />
            </div>
          )}
          <div className="bm-flex bm-min-w-0 bm-flex-1 bm-flex-col bm-gap-1">
            <p className="bm-line-clamp-2 bm-break-words bm-text-[12.5px] bm-leading-snug bm-text-fg">
              {truncatePostText(post.message, 120) ?? (
                <span className="bm-italic bm-text-fg-subtle">{t("posts_no_content")}</span>
              )}
            </p>
            <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-1">
              <Badge size="xs" tone={TYPE_TONE[post.type] ?? TYPE_TONE.own}>
                {typeBadgeLabel(t, post.type)}
              </Badge>
              <Badge size="xs" tone={privConfig.tone} icon={privConfig.icon}>
                {post.privacyLabel || privConfig.label}
              </Badge>
            </div>
            <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-x-2 bm-gap-y-0.5 bm-text-[11px] bm-text-fg-muted">
              <span className="bm-tabular-nums">{formatPostDate(post.creationTime)}</span>
              {post.url && (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bm-inline-flex bm-items-center bm-gap-1 bm-text-brand-ink hover:bm-underline">
                  <ExternalLink size={10} />
                  {t("posts_view_post")}
                </a>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className={cn(TD, "bm-w-10 bm-text-center")}>
        {processed === "success" ? (
          <Badge size="xs" tone="success">
            {t("posts_processed")}
          </Badge>
        ) : (
          <Dropdown items={getPostActionItems(t, onAction, { full: true, canDelete: post.canDelete })} placement="bottom-end" minWidth={210}>
            <IconButton
              size="xs"
              variant="outline"
              label={t("posts_column_action")}
              disabled={processing || !!processed || bulkRunning}>
              {processing ? <Loader2 size={13} className="bm-animate-spin" /> : <MoreHorizontal size={14} />}
            </IconButton>
          </Dropdown>
        )}
      </td>
    </tr>
  )
}
