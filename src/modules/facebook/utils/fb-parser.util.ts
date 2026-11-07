/**
 * Parse raw GraphQL response body (multi-line JSON, "for (;;);" prefix) into chunks.
 * Facebook sometimes returns 2+ JSON objects on separate lines:
 *   chunks[0] → data (edges)
 *   chunks[1] → may contain page_info separately
 */
export function parseGraphqlChunks(rawText: string): Record<string, unknown>[] {
  if (!rawText) return []
  try {
    const cleaned = rawText.replace(/for\s*\(;;\);/, "").trim()
    if (cleaned.startsWith("[")) {
      return JSON.parse(cleaned) as Record<string, unknown>[]
    }
    return cleaned
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l) as Record<string, unknown>)
  } catch {
    return []
  }
}

/**
 * Deep-get a value from an unknown object by chained keys.
 * Returns undefined if any key is missing or the value is not an object.
 */
export function deepGet<T = unknown>(
  obj: unknown,
  ...keys: string[]
): T | undefined {
  let cur: unknown = obj
  for (const k of keys) {
    if (!cur || typeof cur !== "object") return undefined
    cur = (cur as Record<string, unknown>)[k]
  }
  return cur as T
}

type TFunction = (
  key: string,
  params?: Record<string, string | number>
) => string

/**
 * Parse a single GraphQL response body (handles "for (;;);" prefix, multi-line fallback).
 * Throws if no valid JSON found.
 */
export function parseGraphqlResponse(
  text: string,
  t?: TFunction
): Record<string, unknown> {
  let cleaned = text
  if (cleaned.startsWith("for (;;);")) cleaned = cleaned.substring(9)
  try {
    return JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    /* fallback */
  }
  const s = cleaned.indexOf("{")
  const e = cleaned.lastIndexOf("}")
  if (s !== -1 && e > s) {
    try {
      return JSON.parse(cleaned.substring(s, e + 1)) as Record<string, unknown>
    } catch {
      /* ignore */
    }
  }
  const lines = cleaned.split("\n")
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine || !trimmedLine.startsWith("{")) continue
    try {
      const obj = JSON.parse(trimmedLine) as Record<string, unknown>
      if (obj.data) return obj
    } catch {
      /* skip */
    }
  }
  throw new Error(
    t
      ? t("shared_graphql_response_parse_error")
      : "Could not parse the response from Facebook"
  )
}

/**
 * Parse a JSON-only response body (for video upload etc), strips "for (;;);".
 */
export function parseJsonResponse(text: string): Record<string, unknown> {
  const cleaned = text.startsWith("for (;;);") ? text.substring(9) : text
  try {
    return JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    /* fallback */
  }
  const m = cleaned.match(/\{[\s\S]*\}/)
  if (m)
    try {
      return JSON.parse(m[0]) as Record<string, unknown>
    } catch {
      /* ignore */
    }
  return {}
}

/** Decode a base64 story ID to numeric post ID. */
export function postIdFromStory(
  storyId: string | null | undefined
): string | null {
  if (!storyId) return null
  try {
    const safe = String(storyId).replace(/-/g, "+").replace(/_/g, "/")
    const pad = safe.length % 4 ? "=".repeat(4 - (safe.length % 4)) : ""
    const decoded = atob(safe + pad)
    const parts = decoded.split(":")
    const pid = parts[parts.length - 1]
    return /^\d+$/.test(pid) ? pid : null
  } catch {
    return null
  }
}

/** Extract CRITICAL/ERROR entries from a parsed GraphQL response array. */
export function collectCriticalErrors(
  objs: Record<string, unknown>[]
): Array<{ message?: string; summary?: string }> {
  const errs: Array<{ message?: string; summary?: string }> = []
  for (const obj of objs) {
    const errors = obj?.errors as
      | Array<{ severity?: string; message?: string; summary?: string }>
      | undefined
    if (!Array.isArray(errors)) continue
    for (const e of errors) {
      if (e.severity === "CRITICAL" || e.severity === "ERROR") errs.push(e)
    }
  }
  return errs
}

/** Extract video ID from a raw response string. */
export function extractVideoId(text: string): string | null {
  const m = text.match(/"video_id"\s*:\s*"?(\d+)"?/)
  return m ? m[1] : null
}

/** Deep-search an object for a key by name (BFS-ish, max depth 15). */
export function findDeep(obj: unknown, key: string, depth = 0): unknown {
  if (depth > 15 || !obj || typeof obj !== "object") return null
  const rec = obj as Record<string, unknown>
  if (key in rec) return rec[key]
  for (const v of Object.values(rec)) {
    const found = findDeep(v, key, depth + 1)
    if (found !== null) return found
  }
  return null
}

/** Recursively search for `__typename === 'Group'` and return its `id`. */
export function findGroupIdInSections(obj: unknown, depth = 0): string | null {
  if (depth > 15 || !obj || typeof obj !== "object") return null
  const rec = obj as Record<string, unknown>
  if (rec.__typename === "Group" && rec.id) return String(rec.id)
  const vals = Array.isArray(obj) ? (obj as unknown[]) : Object.values(rec)
  for (const v of vals) {
    const found = findGroupIdInSections(v, depth + 1)
    if (found) return found
  }
  return null
}

export class FacebookParser {
  static parseGender(
    gender: string | null | undefined
  ): "Male" | "Female" | "Other" {
    return gender
      ? gender === "MALE"
        ? "Male"
        : gender === "FEMALE"
          ? "Female"
          : "Other"
      : "Other"
  }

  static parseMutualFriends(text: string | null | undefined): number {
    if (!text) return 0
    // Matches both English ("X mutual friend") and Vietnamese ("X bạn chung")
    const match = text.match(/^(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  static parseStatus(
    statusValue: unknown,
    userType: string | null | undefined
  ): "Deactivated" | "Active" {
    return statusValue === null || userType === "RestrictedUser"
      ? "Deactivated"
      : "Active"
  }

  static parseProfilePic(
    profilePic: { uri?: string } | null | undefined
  ): string {
    return profilePic?.uri || ""
  }

  static parseFacebookUrl(
    usernameOrId: string | number | null | undefined,
    fallbackUrl: string | null | undefined
  ): string {
    return fallbackUrl || `https://facebook.com/${usernameOrId}`
  }

  static parseFollowerCount(text: string | null | undefined): string {
    if (!text) return "0"
    const match = text.match(/([\d.]+[KMB]?)/i)
    return match ? match[1] : "0"
  }

  static parseTimestamp(timestamp: number | null | undefined): string {
    if (!timestamp) return "Never"
    return (
      timestamp > 1e10 ? new Date(timestamp) : new Date(timestamp * 1e3)
    ).toLocaleDateString()
  }

  static parseVerificationStatus(
    isVerified: boolean | null | undefined | unknown
  ): "Verified" | "Not Verified" {
    return isVerified ? "Verified" : "Not Verified"
  }

  static parseNumber(
    value: string | number | null | undefined,
    fallback = 0
  ): number {
    if (value == null) return fallback
    const parsed = typeof value === "number" ? value : parseInt(value, 10)
    return isNaN(parsed) ? fallback : parsed
  }
}
