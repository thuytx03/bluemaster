import type {
  AttachKind,
  MediaFile,
  PostSlot
} from "src/modules/automation/types/post-campaign.types"
import { spinBare, splitOptions } from "src/utils/spin-text.util"

type TFunction = (
  key: string,
  params?: Record<string, string | number>
) => string

export const POST_CAMPAIGN_MAX_POSTS = 10
/** Facebook's limit for text on a coloured status background */
export const STATUS_MAX_CHARS = 130
/** localStorage key of this tool's delay config (FacebookDelayConfig) */
export const POST_CAMPAIGN_DELAY_KEY = "fb_delay_post_campaign"
export const POST_CAMPAIGN_DELAY_DEFAULTS = {
  minDelay: 30,
  maxDelay: 60,
  sleepAfter: 30,
  minSleep: 600
}

export function emptySlot(): PostSlot {
  return {
    content: "",
    attachKind: "none",
    images: [],
    video: null,
    videoLinkUrl: "",
    shareLinkUrl: "",
    statusBgIds: [],
    checkin: null,
    feeling: null
  }
}

export function randomCampaignName(t?: TFunction): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let s = ""
  for (let i = 0; i < 8; i++)
    s += chars[Math.floor(Math.random() * chars.length)]
  return t
    ? t("campaign_manager_default_campaign_name", { suffix: s })
    : `Campaign #${s}`
}

/** Spin options of the whole text (`a | b | c`), or the text itself when there is no `|`. */
export function splitSpin(raw: string): string[] {
  return raw.includes("|") ? splitOptions(raw) : raw ? [raw] : []
}

/** Spin + placeholders: [g] group name, [me] my name, [r]/[y]/[q] random happy / surprised / sad emoji. */
export function processContent(
  raw: string,
  groupName: string,
  myName?: string
): string {
  const EMOJI_R = ["😊", "😄", "🥰", "😁", "🤗", "😍"]
  const EMOJI_Y = ["😮", "😲", "🤩", "😯", "🫢"]
  const EMOJI_Q = ["😢", "😔", "🥺", "😞"]
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

  let s = spinBare(raw)
  s = s.replace(/\[g\]/g, groupName)
  s = s.replace(/\[me\]/g, myName ?? "")
  s = s.replace(/\[r\]/g, pick(EMOJI_R))
  s = s.replace(/\[y\]/g, pick(EMOJI_Y))
  s = s.replace(/\[q\]/g, pick(EMOJI_Q))
  return s
}

export function randInt(lo: number, hi: number): number {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo
}

export function nowTs(): string {
  return new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  })
}

export function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5)
}

/** Maps raw posting errors to a short, user-facing message. */
export function friendlyError(msg: string, t: TFunction): string {
  const s = (msg || "").toLowerCase()
  if (s.includes("graphql document"))
    return t("campaign_manager_runner_error_rate_limited")
  if (s.includes("network") || s.includes("fetch"))
    return t("campaign_manager_runner_error_network")
  if (s.includes("login") || s.includes("cookie"))
    return t("campaign_manager_runner_error_relogin_required")
  if (s.includes("ẩn danh") || s.includes("anonymous"))
    return t("campaign_manager_runner_error_anonymous_not_supported")
  if (s.includes("1357004"))
    return t("campaign_manager_runner_error_no_post_permission")
  return msg.length <= 200 ? msg : msg.slice(0, 197) + "..."
}

/** Group + post id from a `/groups/<gid>/permalink|posts/<pid>` URL. */
export function extractPostIds(
  url: string
): { gId: string; pId: string } | null {
  const m = url.match(/\/groups\/(\d+)\/(?:permalink|posts)\/(\d+)/)
  return m ? { gId: m[1], pId: m[2] } : null
}

export function getTypeLabel(
  t: TFunction,
  p: { attachKind: AttachKind; images: unknown[]; video: unknown }
): string {
  if (p.attachKind === "image" && p.images.length > 0)
    return t("campaign_manager_type_image", { count: p.images.length })
  if (p.attachKind === "status_images")
    return t("campaign_manager_type_status_images", {
      count: p.images.length
    })
  if (p.attachKind === "status") return t("campaign_manager_type_status")
  if (p.attachKind === "video" && p.video)
    return t("campaign_manager_type_video")
  if (p.attachKind === "video_link")
    return t("campaign_manager_type_video_link")
  if (p.attachKind === "link") return t("campaign_manager_type_link")
  return t("campaign_manager_type_text")
}

export function readFileAsDataUrl(file: File): Promise<MediaFile> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve({ dataUrl: r.result as string, name: file.name })
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export function formatSyncedAt(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("vi-VN")
}
