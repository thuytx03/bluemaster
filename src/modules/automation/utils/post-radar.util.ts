import type {
  RadarPost,
  RadarSortDir,
  RadarSortKey
} from "src/modules/automation/types/post-radar.types"

/** localStorage key of this tool's delay config (source: `fb_delay_post_radar`). */
export const POST_RADAR_DELAY_KEY = "bm_fb_delay_post_radar"
/** Source defaults for the delay between two posts, in seconds. */
export const POST_RADAR_DELAY_DEFAULTS = { minDelay: 8, maxDelay: 25 }

/** `dd/mm/yy hh:mm` from unix seconds, `—` when unknown. */
export function formatDateTime(ts: number): string {
  if (!ts) return "—"
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    pad(d.getDate()) +
    "/" +
    pad(d.getMonth() + 1) +
    "/" +
    String(d.getFullYear()).slice(2) +
    " " +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  )
}

/** 1.2K / 3M style counts. */
export function formatNumber(n: number): string {
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  return String(n)
}

export function sortRadarRows<T extends { p: RadarPost }>(
  rows: T[],
  sortKey: RadarSortKey,
  sortDir: RadarSortDir
): T[] {
  return [...rows].sort((a, b) => {
    const av = a.p[sortKey] as number | string
    const bv = b.p[sortKey] as number | string
    const cmp =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv))
    return sortDir === "asc" ? cmp : -cmp
  })
}

// ─── CSV export / import ───────────────────────────────────────────────────────

export const RADAR_CSV_HEADERS = [
  "post_id",
  "source_id",
  "post_type",
  "author_name",
  "created_time",
  "like_count",
  "comment_count",
  "share_count",
  "image_url",
  "permalink",
  "message"
]

/** Rows for `exportToCSV`; newlines are flattened so a message stays on one CSV row. */
export function radarPostsToCsvRows(posts: RadarPost[]): string[][] {
  const cell = (v: string | number) => String(v).replace(/\r?\n/g, " ")
  return posts.map((p) =>
    [
      p.postId,
      p.sourceId,
      p.postType,
      p.authorName,
      p.createdTime,
      p.likeCount,
      p.commentCount,
      p.shareCount,
      p.imageUrl,
      p.permalink,
      p.message
    ].map(cell)
  )
}

/** RFC-4180 parser (quoted fields may contain separators / newlines); tab-separated files are detected. */
export function parseCsvText(raw: string): string[][] {
  // Strip the BOM and Excel's `sep=` hint line if present
  const text = raw.replace(/^﻿/, "").replace(/^sep=.*\r?\n/i, "")
  const isTab = text.indexOf("\t") !== -1 && !text.startsWith('"')
  const SEP = isTab ? "\t" : ","
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuote = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuote) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') inQuote = false
      else field += ch // includes \r and \n inside quoted fields
    } else if (SEP === "," && ch === '"') {
      inQuote = true
    } else if (ch === SEP) {
      row.push(field.trim())
      field = ""
    } else if (ch === "\r") {
      // skip bare CR
    } else if (ch === "\n") {
      row.push(field.trim())
      field = ""
      if (row.some((c) => c)) rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  if (field || row.length) {
    row.push(field.trim())
    if (row.some((c) => c)) rows.push(row)
  }
  return rows
}

/**
 * Posts from parsed CSV rows (first row = header). Our own export format is
 * read column by column; any other file is read as one post id per row.
 * Returns `null` when the file has no data row.
 */
export function radarPostsFromCsv(allRows: string[][]): RadarPost[] | null {
  if (allRows.length < 2) return null

  const headerRow = allRows[0].map((h) => h.toLowerCase())
  const col = (key: string) => headerRow.indexOf(key)
  const isOurFormat = col("post_id") !== -1

  const imported: RadarPost[] = []
  for (const r of allRows.slice(1)) {
    const get = (key: string) => r[col(key)]?.trim() ?? ""
    if (isOurFormat) {
      const postId = get("post_id")
      if (!postId) continue
      imported.push({
        postId,
        sourceId: get("source_id"),
        postType: (get("post_type") as RadarPost["postType"]) || "text",
        authorName: get("author_name"),
        createdTime: Number(get("created_time")) || 0,
        likeCount: Number(get("like_count")) || 0,
        commentCount: Number(get("comment_count")) || 0,
        shareCount: Number(get("share_count")) || 0,
        imageUrl: get("image_url"),
        permalink: get("permalink") || `https://www.facebook.com/${postId}`,
        message: get("message")
      })
    } else {
      const postId = r[0]?.trim() ?? ""
      if (!postId) continue
      imported.push({
        postId,
        sourceId: "",
        postType: "text",
        authorName: "",
        createdTime: 0,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        imageUrl: "",
        permalink: `https://www.facebook.com/${postId}`,
        message: ""
      })
    }
  }
  return imported
}
