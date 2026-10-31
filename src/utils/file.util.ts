import dayjs from "dayjs"

import { MAX_TITLE_LENGTH_IN_FILE_NAME } from "src/constants/download.constants"
import {
  TFileNameToken,
  TMediaType
} from "src/modules/download/types/download.types"

const ILLEGAL_CHARS = /[/?<>\\:*|"]/g
const CONTROL_CHARS = /[\x00-\x1f\x80-\x9f]/g
// eslint-disable-next-line no-misleading-character-class
const ZERO_WIDTH_CHARS = /[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFE00-\uFE0F]/g
const RESERVED_NAMES = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i
const TRAILING_DOTS_AND_SPACES = /[. ]+$/

/**
 * Make a string safe to use as a single path segment on Windows / macOS / Linux.
 * Mirrors the behaviour of the `sanitize-filename` package.
 */
export const sanitizeFilename = (input: string, maxLength = 200): string => {
  let name = input
    .replace(ILLEGAL_CHARS, "")
    .replace(CONTROL_CHARS, "")
    .replace(ZERO_WIDTH_CHARS, "")
    .replace(/\s+/g, " ")
    .replace(TRAILING_DOTS_AND_SPACES, "")
    .trim()
  if (RESERVED_NAMES.test(name)) name = ""
  return name.slice(0, maxLength)
}

/** Unix seconds → "20261030_153045" (sortable, no illegal characters) */
export const formatTimestampForFileName = (timestamp?: number | string) => {
  if (!timestamp) return ""
  const n = Number(timestamp)
  if (!Number.isFinite(n) || n <= 0) return ""
  // Facebook returns seconds; guard against millisecond input
  const d = n > 1e12 ? dayjs(n) : dayjs.unix(n)
  return d.isValid() ? d.format("YYYYMMDD_HHmmss") : ""
}

interface IGetFilenameParams {
  order?: number | string
  id?: string
  title?: string
  timestamp?: number | string
  format?: TFileNameToken[]
}

/**
 * Build a file name (without extension) from the selected tokens, in order.
 * Falls back to `<order>_<id>` when the format is empty or produces nothing.
 */
export const getFilename = ({
  order,
  id,
  title,
  timestamp,
  format
}: IGetFilenameParams): string => {
  const fallback = [order, id]
    .filter((v) => v !== undefined && v !== null && v !== "")
    .join("_")
  if (!format || format.length === 0) {
    return sanitizeFilename(fallback) || "file"
  }
  const parts = format.map((token) => {
    switch (token) {
      case "numericalOrder":
        return order !== undefined && order !== null ? String(order) : ""
      case "id":
        return id ?? ""
      case "title":
        return title
          ? sanitizeFilename(title.slice(0, MAX_TITLE_LENGTH_IN_FILE_NAME))
          : ""
      case "timestamp":
        return formatTimestampForFileName(timestamp)
      default:
        return ""
    }
  })
  const joined = parts.filter(Boolean).join("_")
  return sanitizeFilename(joined || fallback) || "file"
}

export const getFileExtensionByMediaType = (mediaType: TMediaType) =>
  mediaType === "VIDEO" ? "mp4" : "jpg"

/** Join path segments, dropping empties and duplicated slashes */
export const joinPath = (...segments: (string | undefined | null | false)[]) =>
  segments
    .filter((s): s is string => !!s)
    .map((s) => s.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/")

export const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") resolve(reader.result)
      else reject(new Error("Failed to convert blob to base64"))
    }
    reader.onerror = (e) => reject(e)
    reader.readAsDataURL(blob)
  })
