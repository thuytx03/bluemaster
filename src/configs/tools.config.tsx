import {
  Braces,
  Download,
  FileDown,
  FileUp,
  Inbox,
  Link2,
  Pickaxe,
  Settings
} from "lucide-react"
import { ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"

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

export type TToolCategory = "facebook" | "automation" | "utility"

export interface ToolCategory {
  key: TToolCategory
  label: string
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

/** Tools pinned to the navigation rail by default */
export const DEFAULT_PINNED: TToolKey[] = [
  "batch-download",
  "scan-uid",
  "auto-inbox",
  "access-token"
]

export const MAX_PINNED = 6

export const useToolCategories = (): ToolCategory[] => {
  const { t } = useTranslation()
  return useMemo(
    () => [
      { key: "facebook", label: "Facebook", description: t("cat_facebook_desc") },
      { key: "automation", label: t("automation"), description: t("cat_automation_desc") },
      { key: "utility", label: t("cat_utility"), description: t("cat_utility_desc") }
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
export const useActiveTool = (pathname: string, tools: Tool[]): Tool | undefined =>
  useMemo(() => {
    if (pathname === APP_ROUTES.FACEBOOK.EXPORT_UID) return tools.find((t) => t.key === "scan-uid")
    return tools.find((t) => t.path === pathname)
  }, [pathname, tools])
