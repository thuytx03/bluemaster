import { normalizeForSearch } from "src/configs/tools.config"
import type { Post, PostPrivacyFilter, PostTypeFilter } from "src/modules/content/types/posts.types"
import type { TDateRange } from "src/modules/download/types/download.types"

/** "dd/MM/yyyy HH:mm" in vi-VN, or "—" when Facebook gave no timestamp. */
export function formatPostDate(timestamp: number): string {
  if (!timestamp) return "—"
  return new Date(timestamp * 1000).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

/** Truncates with an ellipsis; returns null for empty content so the caller can show its placeholder. */
export function truncatePostText(str: string | null, maxLen = 100): string | null {
  if (!str) return null
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str
}

/** "yyyy-mm-dd" (native date input) -> unix seconds at the start / end of that local day. */
function dayBoundary(value: string, end: boolean): number | null {
  if (!value) return null
  const [y, m, d] = value.split("-").map(Number)
  if (!y || !m || !d) return null
  const date = new Date(y, m - 1, d)
  if (end) date.setHours(23, 59, 59, 999)
  else date.setHours(0, 0, 0, 0)
  return date.getTime() / 1000
}

export interface PostFilters {
  search: string
  type: PostTypeFilter
  privacy: PostPrivacyFilter
  dateRange: TDateRange | null
}

/** Client-side search + type / privacy / date-range filter (source: `filteredPosts` memo). */
export function filterPosts(posts: Post[], { search, type, privacy, dateRange }: PostFilters): Post[] {
  const q = normalizeForSearch(search)
  const startTs = dateRange ? dayBoundary(dateRange[0], false) : null
  const endTs = dateRange ? dayBoundary(dateRange[1], true) : null

  return posts.filter((p) => {
    if (q) {
      const match = normalizeForSearch(p.message ?? "").includes(q) || p.url.includes(q) || p.privacyLabel.includes(q)
      if (!match) return false
    }
    if (type !== "all" && p.type !== type) return false
    if (privacy !== "all" && p.privacy !== privacy) return false
    if (startTs !== null && p.creationTime < startTs) return false
    if (endTs !== null && p.creationTime > endTs) return false
    return true
  })
}
