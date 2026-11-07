import type { TFunction } from "i18next"

import type {
  CkCategoryFilter,
  CkPost
} from "src/modules/automation/types/comment-hunter.types"

const pad = (n: number) => String(n).padStart(2, "0")

/** "dd/MM HH:mm" from unix seconds. */
export function formatAbsoluteShort(ts: number): string {
  if (!ts) return "—"
  const d = new Date(ts * 1000)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatRelativeTime(ts: number, t: TFunction): string {
  if (!ts) return "—"
  const sec = Math.floor((Date.now() - ts * 1000) / 1000)
  if (sec < 10) return t("comment_hunter_time_just_now")
  if (sec < 60) return t("comment_hunter_time_seconds_ago", { count: sec })
  const min = Math.floor(sec / 60)
  if (min < 60) return t("comment_hunter_time_minutes_ago", { count: min })
  const hr = Math.floor(min / 60)
  if (hr < 24) return t("comment_hunter_time_hours_ago", { count: hr })
  const day = Math.floor(hr / 24)
  if (day < 7) return t("comment_hunter_time_days_ago", { count: day })
  const week = Math.floor(day / 7)
  if (week < 5) return t("comment_hunter_time_weeks_ago", { count: week })
  return formatAbsoluteShort(ts)
}

export const postCategory = (p: CkPost): "group" | "page" =>
  p.groupId ? "group" : "page"

/** Posts with their index in the full list, filtered by category. */
export function filterPostsByCategory(
  posts: CkPost[],
  filter: CkCategoryFilter
) {
  return posts
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => filter === "all" || postCategory(p) === filter)
}

/** Unique by post id, then max one post per group (anti-spam rule of the source). */
export function dedupePostsForRun(posts: CkPost[]): {
  posts: CkPost[]
  skipped: number
} {
  const unique = posts.filter(
    (p, i, arr) => arr.findIndex((x) => x.postId === p.postId) === i
  )
  const perGroup = unique.filter((p, i, arr) => {
    if (!p.groupId) return true
    return arr.findIndex((x) => String(x.groupId) === String(p.groupId)) === i
  })
  return { posts: perGroup, skipped: unique.length - perGroup.length }
}

export function parseCommentLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

/** Random delay in ms between two bounds given in seconds (order-insensitive). */
export function randomDelayMs(delayMin: number, delayMax: number): number {
  const lo = Math.min(delayMin, delayMax)
  const hi = Math.max(delayMin, delayMax)
  return (lo + Math.random() * (hi - lo)) * 1000
}

export const postLink = (p: CkPost) =>
  p.postUrl || "https://www.facebook.com/" + p.postId

export const truncate = (s: string, n: number) =>
  s.length > n ? s.slice(0, n) + "…" : s

export function readImageFiles(
  files: FileList | File[]
): Promise<{ dataUrl: string; name: string; type: string }[]> {
  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise<{ dataUrl: string; name: string; type: string }>(
          (resolve) => {
            const reader = new FileReader()
            reader.onload = () =>
              resolve({
                dataUrl: reader.result as string,
                name: file.name,
                type: file.type || "image/jpeg"
              })
            reader.readAsDataURL(file)
          }
        )
    )
  )
}
