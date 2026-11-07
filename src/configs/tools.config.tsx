import {
  Bot,
  Braces,
  Download,
  FileDown,
  FileText,
  FileUp,
  Inbox,
  Link2,
  MessageSquareCode,
  MessageSquareText,
  Pickaxe,
  Radar,
  Rss,
  Send,
  Settings,
  Share2,
  Users,
  UsersRound,
  Wrench
} from "lucide-react"
import { ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { FacebookIcon } from "src/assets/icons"
import { APP_ROUTES } from "src/constants/route.constants"

export type TToolKey =
  | "access-token"
  | "scan-uid"
  | "batch-download"
  | "auto-inbox"
  | "multi-url-download"
  | "export-cookies"
  | "import-cookies"
  | "settings"
  | "fb-friends"
  | "fb-following"
  | "fb-groups"
  | "fb-posts"
  | "fb-download-messages"
  | "fb-post-radar"
  | "fb-comment-hunter"
  | "fb-post-campaign"
  | "fb-max-power-share"
  | "fb-auto-bot-comment"

export type TToolCategory =
  | "facebook"
  | "account"
  | "content"
  | "automation"
  | "utility"

export interface ToolCategory {
  key: TToolCategory
  label: string
  /** Short label under the category icon on the navigation rail */
  railLabel: string
  icon: ReactNode
  description?: string
}

export interface Tool {
  key: TToolKey
  category: TToolCategory
  path: string
  label: string
  description: string
  icon: ReactNode
  /** Tailwind text colour for the icon */
  color: string
  isNew?: boolean
  /** Hidden from the tool grids (still routable) */
  utility?: boolean
}

/** Nothing pinned by default: the rail already lists every tool through its category fly-outs */
export const DEFAULT_PINNED: TToolKey[] = []

/** Tools that fit on the navigation rail (it scrolls past what the screen shows) */
export const MAX_PINNED = 12

export const useToolCategories = (): ToolCategory[] => {
  const { t } = useTranslation()
  return useMemo(
    () => [
      {
        key: "facebook",
        label: "Facebook",
        railLabel: "Facebook",
        icon: <FacebookIcon />,
        description: t("cat_facebook_desc")
      },
      {
        key: "account",
        label: t("cat_account"),
        railLabel: t("cat_account_short"),
        icon: <Users />,
        description: t("cat_account_desc")
      },
      {
        key: "content",
        label: t("cat_content"),
        railLabel: t("cat_content"),
        icon: <FileText />,
        description: t("cat_content_desc")
      },
      {
        key: "automation",
        label: t("automation"),
        railLabel: t("cat_automation_short"),
        icon: <Bot />,
        description: t("cat_automation_desc")
      },
      {
        key: "utility",
        label: t("cat_utility"),
        railLabel: t("cat_utility"),
        icon: <Wrench />,
        description: t("cat_utility_desc")
      }
    ],
    [t]
  )
}

/** Strip Vietnamese diacritics + lowercase for search */
export const normalizeForSearch = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()

export const useTools = (): Tool[] => {
  const { t } = useTranslation()
  return useMemo(
    () => [
      {
        key: "batch-download",
        category: "facebook",
        path: APP_ROUTES.DOWNLOAD_ALL.FACEBOOK,
        label: t("batch_download"),
        description: t("nav_batch_download_desc"),
        icon: <Download />,
        color: "bm-text-[#1877F2]"
      },
      {
        key: "scan-uid",
        category: "facebook",
        path: APP_ROUTES.FACEBOOK.EXTRACT_UID,
        label: t("scan_uid"),
        description: t("nav_scan_uid_desc"),
        icon: <Pickaxe />,
        color: "bm-text-violet-500"
      },
      {
        key: "auto-inbox",
        category: "automation",
        path: APP_ROUTES.INBOX,
        label: t("auto_inbox"),
        description: t("nav_auto_inbox_desc"),
        icon: <Inbox />,
        color: "bm-text-brand-ink",
        isNew: true
      },
      {
        key: "access-token",
        category: "facebook",
        path: APP_ROUTES.FACEBOOK.ACCESS_TOKEN,
        label: "Access Token",
        description: t("eaab_extract_desc"),
        icon: <Braces />,
        color: "bm-text-emerald-500"
      },
      {
        key: "multi-url-download",
        category: "facebook",
        path: APP_ROUTES.MULTI_URL_DOWNLOAD,
        label: t("multi_url_download"),
        description: t("nav_multi_url_download_desc"),
        icon: <Link2 />,
        color: "bm-text-cyan-500"
      },
      {
        key: "fb-friends",
        category: "account",
        path: APP_ROUTES.FACEBOOK.FRIENDS,
        label: t("fb_friends_hub"),
        description: t("nav_fb_friends_desc"),
        icon: <Users />,
        color: "bm-text-[#1877F2]",
        isNew: true
      },
      {
        key: "fb-following",
        category: "account",
        path: APP_ROUTES.FACEBOOK.FOLLOWING,
        label: t("fb_following_hub"),
        description: t("nav_fb_following_desc"),
        icon: <Rss />,
        color: "bm-text-sky-500",
        isNew: true
      },
      {
        key: "fb-groups",
        category: "account",
        path: APP_ROUTES.FACEBOOK.GROUPS,
        label: t("fb_groups"),
        description: t("nav_fb_groups_desc"),
        icon: <UsersRound />,
        color: "bm-text-violet-500",
        isNew: true
      },
      {
        key: "fb-posts",
        category: "content",
        path: APP_ROUTES.FACEBOOK.POSTS,
        label: t("fb_posts"),
        description: t("nav_fb_posts_desc"),
        icon: <FileText />,
        color: "bm-text-sky-600",
        isNew: true
      },
      {
        key: "fb-download-messages",
        category: "content",
        path: APP_ROUTES.FACEBOOK.DOWNLOAD_MESSAGES,
        label: t("fb_download_messages"),
        description: t("nav_fb_download_messages_desc"),
        icon: <MessageSquareCode />,
        color: "bm-text-blue-500",
        isNew: true
      },
      {
        key: "fb-post-radar",
        category: "automation",
        path: APP_ROUTES.FACEBOOK.POST_RADAR,
        label: t("fb_post_radar"),
        description: t("nav_fb_post_radar_desc"),
        icon: <Radar />,
        color: "bm-text-emerald-500",
        isNew: true
      },
      {
        key: "fb-comment-hunter",
        category: "automation",
        path: APP_ROUTES.FACEBOOK.COMMENT_HUNTER,
        label: t("fb_comment_hunter"),
        description: t("nav_fb_comment_hunter_desc"),
        icon: <MessageSquareText />,
        color: "bm-text-amber-500",
        isNew: true
      },
      {
        key: "fb-post-campaign",
        category: "automation",
        path: APP_ROUTES.FACEBOOK.POST_CAMPAIGN,
        label: t("fb_post_campaign"),
        description: t("nav_fb_post_campaign_desc"),
        icon: <Send />,
        color: "bm-text-indigo-500",
        isNew: true
      },
      {
        key: "fb-max-power-share",
        category: "automation",
        path: APP_ROUTES.FACEBOOK.MAX_POWER_SHARE,
        label: t("fb_max_power_share"),
        description: t("nav_fb_max_power_share_desc"),
        icon: <Share2 />,
        color: "bm-text-pink-500",
        isNew: true
      },
      {
        key: "fb-auto-bot-comment",
        category: "automation",
        path: APP_ROUTES.FACEBOOK.AUTO_BOT_COMMENT,
        label: t("fb_auto_bot_comment"),
        description: t("nav_fb_auto_bot_comment_desc"),
        icon: <Bot />,
        color: "bm-text-violet-500",
        isNew: true
      },
      {
        key: "export-cookies",
        category: "utility",
        path: APP_ROUTES.COOKIES.EXPORT,
        label: t("export_cookies"),
        description: t("nav_export_cookies_desc"),
        icon: <FileDown />,
        color: "bm-text-amber-500"
      },
      {
        key: "import-cookies",
        category: "utility",
        path: APP_ROUTES.COOKIES.IMPORT,
        label: t("import_cookies"),
        description: t("nav_import_cookies_desc"),
        icon: <FileUp />,
        color: "bm-text-orange-500"
      },
      {
        key: "settings",
        category: "utility",
        path: APP_ROUTES.SETTINGS,
        label: t("settings"),
        description: t("appearance_desc"),
        icon: <Settings />,
        color: "bm-text-fg-muted",
        utility: true
      }
    ],
    [t]
  )
}

/** Which tool owns a pathname (the UID export screen belongs to "scan-uid"). */
export const useActiveTool = (
  pathname: string,
  tools: Tool[]
): Tool | undefined =>
  useMemo(() => {
    if (pathname === APP_ROUTES.FACEBOOK.EXPORT_UID)
      return tools.find((t) => t.key === "scan-uid")
    return tools.find((t) => t.path === pathname)
  }, [pathname, tools])
