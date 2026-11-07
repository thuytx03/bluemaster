/**
 * Facebook requests of the "post campaign" tool (ported from xthuy-social
 * `post-campaign`): joined-groups sync, status background presets, check-in
 * place search and downloading a video from a link. Posting / commenting /
 * reacting / uploading reuse `fb-post.service`.
 *
 * Plain async functions — no React, toast or i18n.
 */
import type {
  CheckinPlace,
  MediaFile,
  StatusBgCategory,
  StatusBgPreset
} from "src/modules/automation/types/post-campaign.types"
import {
  fbFetch,
  fetchGraphQl,
  getSessionTokens,
  parseSafe
} from "src/modules/facebook/services/fb-graphql.service"

// ─── Status backgrounds ────────────────────────────────────────────────────────

function toHex(c: string | null | undefined): string | null {
  if (!c || typeof c !== "string") return null
  const s = c.replace(/^#/, "").trim()
  if (s.length === 6) return "#" + s
  if (s.length === 8) return "#" + s.slice(-6) // AARRGGBB → RRGGBB
  return null
}

function normalizePresets(items: unknown[]): StatusBgPreset[] {
  return items.flatMap((item) => {
    const p = (item as Record<string, unknown>)?.preset as
      | Record<string, unknown>
      | undefined
    if (!p?.preset_id) return []
    const bg = (p.background ?? {}) as Record<string, unknown>
    const thumbUrl =
      ((p.default_thumbnail as Record<string, unknown> | undefined)?.uri as
        | string
        | null) ?? null
    const imgUrl =
      ((bg.image as Record<string, unknown> | undefined)?.uri as
        | string
        | null) ?? thumbUrl
    return [
      {
        id: String(p.preset_id),
        desc: (p.background_description as string) || "",
        bgColor:
          toHex(p.background_color as string) ??
          toHex(bg.color as string) ??
          "#EFEFEF",
        gradColor:
          toHex(p.background_gradient_color as string) ??
          toHex(bg.gradient_color as string) ??
          null,
        gradDir: (p.background_gradient_direction ??
          bg.gradient_direction ??
          null) as string | null,
        textColor: toHex(p.color as string) ?? "#333333",
        imgUrl,
        thumbUrl
      }
    ]
  })
}

/** Names used when Facebook's category has no name (caller passes translated labels) */
export interface StatusBgLabels {
  color: string
  other: string
}

function parseStatusBgCategories(
  body: string,
  labels: StatusBgLabels
): StatusBgCategory[] | null {
  for (const line of body.split("\n")) {
    const trimmed = line.trim().replace(/^for \(;;\);/, "")
    if (!trimmed.startsWith("{")) continue
    try {
      const json = JSON.parse(trimmed)
      const categorized = json?.data?.viewer?.categorized_text_format_presets
      if (Array.isArray(categorized) && categorized.length) {
        return categorized.flatMap((cat: Record<string, unknown>) => {
          const ranked = cat?.ranked_text_format_presets
          if (!Array.isArray(ranked) || !ranked.length) return []
          const presets = normalizePresets(ranked)
          return presets.length
            ? [
                {
                  name: ((cat.name || cat.title) as string) || labels.other,
                  presets
                }
              ]
            : []
        })
      }
      const ranked = json?.data?.viewer?.ranked_composer_text_format_presets
      if (Array.isArray(ranked) && ranked.length)
        return [{ name: labels.color, presets: normalizePresets(ranked) }]
    } catch {
      /* try the next line */
    }
  }
  return null
}

/**
 * Live status background presets of the composer swatch picker
 * (`CometComposerSwatchPickerMenuUsingRelayEntrypointQuery`, doc_id 26113351444997085).
 * Returns null when the request or parsing fails (caller keeps the built-in list).
 */
export async function fetchStatusBackgrounds(
  labels: StatusBgLabels
): Promise<StatusBgCategory[] | null> {
  try {
    const { uid, lsd } = await getSessionTokens()
    if (!uid) return null
    const res = await fetchGraphQl(
      {
        av: uid,
        __user: uid,
        __a: "1",
        __comet_req: "15",
        lsd,
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name:
          "CometComposerSwatchPickerMenuUsingRelayEntrypointQuery",
        variables: JSON.stringify({
          containsCustomSwatchCategory: false,
          scale: 1
        }),
        server_timestamps: "true",
        doc_id: "26113351444997085"
      },
      {
        customHeaders: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest"
        }
      }
    )
    const body = res?.data?.body
    if (!res?.ok || !body) return null
    const parsed = parseStatusBgCategories(body, labels)
    return parsed && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

// ─── Check-in search ───────────────────────────────────────────────────────────

/** Places for the composer check-in (`useComposerLocationPickerTypeaheadDataSourceQuery`, doc_id 25574982832137188). */
export async function searchCheckinPlaces(
  query: string
): Promise<CheckinPlace[]> {
  const { uid } = await getSessionTokens()
  if (!uid) return []
  const res = await fetchGraphQl({
    av: uid,
    __user: uid,
    __a: "1",
    fb_api_caller_class: "RelayModern",
    fb_api_req_friendly_name:
      "useComposerLocationPickerTypeaheadDataSourceQuery",
    variables: JSON.stringify({
      query_data: { caller_platform: "FB_COMPOSER_CHECKIN", query },
      num_nearby_places: 20,
      category_icon_size: 72
    }),
    server_timestamps: "true",
    doc_id: "25574982832137188"
  })
  if (!res?.ok) return []
  const json = parseSafe(res.data?.body ?? "", {})
  const edges: { node: Record<string, unknown> }[] =
    json?.data?.checkin_search_query?.place_results?.edges ?? []
  return edges
    .map((e) => e.node)
    .filter((n) => n?.id && n?.name)
    .map((n) => ({
      id: String(n.id),
      name: String(n.name),
      address: String(
        (n.address as Record<string, unknown>)?.single_line ??
          n.contextual_name ??
          ""
      )
    }))
    .filter((p) => p.id && p.name)
}

// ─── Video link download ───────────────────────────────────────────────────────

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(blob)
  })

const isSameOrigin = (url: string) => {
  try {
    return new URL(url).origin === location.origin
  } catch {
    return false
  }
}

/**
 * Downloads a video file from `url` as a data URL (the source relayed it through
 * the extension's `customFetch`, which returns binary bodies as `data:` URLs).
 * Returns null when the URL is not a binary file (e.g. an HTML watch page).
 */
export async function downloadVideoFromLink(
  url: string
): Promise<MediaFile | null> {
  let dataUrl: string | null = null
  if (isSameOrigin(url)) {
    // fbFetch reads same-origin bodies as text, so fetch the bytes here
    try {
      const res = await fetch(url, { method: "GET", credentials: "include" })
      const type = res.headers.get("Content-Type") ?? ""
      const textual =
        type.startsWith("text/") ||
        type.includes("json") ||
        type.includes("javascript") ||
        type.includes("xml")
      if (res.ok && !textual) dataUrl = await blobToDataUrl(await res.blob())
    } catch {
      dataUrl = null
    }
  } else {
    const res = await fbFetch(url, { method: "GET", credentials: "include" })
    const body = res.ok ? res.data?.body : null
    dataUrl = body && body.startsWith("data:") ? body : null
  }
  if (!dataUrl) return null
  const ext = url.split("?")[0].split(".").pop() ?? "mp4"
  return { dataUrl, name: `video.${ext}` }
}

const postCampaignService = {
  fetchStatusBackgrounds,
  searchCheckinPlaces,
  downloadVideoFromLink
}
export default postCampaignService
