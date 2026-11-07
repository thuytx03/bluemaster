import type { GroupTarget } from "src/modules/automation/types/max-power-share.types"
import type { DelayConfig } from "src/modules/facebook/utils/delay-config.util"

type TFn = (key: string, params?: Record<string, string | number>) => string

/** localStorage key of this tool's delay config (same key as xthuy-social). */
export const DELAY_STORAGE_KEY = "fb_delay_max_power_share"
export const DELAY_DEFAULTS: Partial<DelayConfig> = {
  minDelay: 30,
  maxDelay: 100,
  sleepAfter: 10,
  minSleep: 120
}

/** Parses one line: a group ID or a facebook.com/groups/... link. */
export function parseGroupInput(raw: string): GroupTarget | null {
  const t = raw.trim()
  if (!t) return null

  const m = t.match(/facebook\.com\/groups\/([^/?#]+)/)
  if (m) return { groupId: m[1], groupName: m[1] }

  if (/^\d+$/.test(t)) return { groupId: t, groupName: t }

  return null
}

export function parseGroupList(
  text: string,
  t: TFn
): { valid: true; items: GroupTarget[] } | { valid: false; error: string } {
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  const items: GroupTarget[] = []
  const seen = new Set<string>()
  for (let i = 0; i < lines.length; i++) {
    const p = parseGroupInput(lines[i])
    if (!p) {
      const preview =
        lines[i].length > 40 ? lines[i].slice(0, 40) + "…" : lines[i]
      return {
        valid: false,
        error: t("max_power_share_error_invalid_line", { line: i + 1, preview })
      }
    }
    if (!seen.has(p.groupId)) {
      seen.add(p.groupId)
      items.push(p)
    }
  }
  return { valid: true, items }
}

export function randInt(lo: number, hi: number): number {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo
}

export function nowTs(): string {
  return new Date().toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  })
}

/** Estimated run time in seconds. */
export function estimateEtaSec(
  total: number,
  delayMin: number,
  delayMax: number,
  restAfterGroups: number,
  restMinutes: number
): number {
  if (total <= 0) return 0
  const avgDelay = (delayMin + delayMax) / 2
  const delays = (total - 1) * avgDelay
  const rests =
    restAfterGroups > 0 && restMinutes > 0
      ? Math.floor(total / restAfterGroups) * restMinutes * 60
      : 0
  return Math.round(delays + rests)
}

export function formatEta(sec: number, t: TFn): string {
  sec = Math.max(0, Math.floor(sec))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0)
    return t("max_power_share_eta_hours_minutes", {
      h,
      m: String(m).padStart(2, "0")
    })
  if (m > 0)
    return t("max_power_share_eta_minutes_seconds", {
      m,
      s: String(s).padStart(2, "0")
    })
  return t("max_power_share_eta_seconds", { s })
}

/** Converts the saved delay config into the run's delay / rest parameters (same mapping as the source). */
export function delayToRunParams(dc: DelayConfig) {
  return {
    delayMin: Math.max(1, dc.minDelay),
    delayMax: Math.max(dc.minDelay, dc.maxDelay),
    restAfterGroups: dc.sleepAfter,
    restMinutes: Math.round(dc.minSleep / 60)
  }
}
