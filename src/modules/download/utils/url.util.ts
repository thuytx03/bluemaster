import { ESingleDownloadType } from "src/constants/enum"
import { SINGLE_DOWNLOAD_TYPES } from "src/constants/download.constants"
import {
  FACEBOOK_GROUP_URL_PATTERN,
  FACEBOOK_PROFILE_ID_URL_PATTERN,
  FACEBOOK_USERNAME_URL_PATTERN,
  SINGLE_DOWNLOAD_URL_PATTERNS
} from "src/constants/regex.constants"
import { TFacebookTarget } from "src/modules/download/types/download.types"

export interface IDetectedDownloadUrl {
  downloadType: ESingleDownloadType
  matchedResult: RegExpMatchArray
}

/** Match a URL against every supported single-download pattern (ordered). */
export const detectDownloadTypeByUrl = (url: string): IDetectedDownloadUrl | null => {
  for (const { type } of SINGLE_DOWNLOAD_TYPES) {
    for (const pattern of SINGLE_DOWNLOAD_URL_PATTERNS[type]) {
      const matchedResult = url.match(pattern)
      if (matchedResult) return { downloadType: type, matchedResult }
    }
  }
  return null
}

/** Short id shown in the process table */
export const extractDisplayIdFromMatch = ({
  downloadType,
  matchedResult,
  url
}: IDetectedDownloadUrl & { url: string }) => {
  if (downloadType === ESingleDownloadType.FACEBOOK_POST_MEDIA) {
    // post patterns capture (author, postId) or the raw query string
    return matchedResult[2] || matchedResult[1] || url
  }
  return matchedResult[1] || url
}

export const extractIdByRegex = ({
  url,
  regexPattern
}: {
  url: string
  regexPattern: RegExp | RegExp[]
}) => {
  const patterns = Array.isArray(regexPattern) ? regexPattern : [regexPattern]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }
  throw new Error("URL không hợp lệ")
}

/**
 * Accepts a profile/group URL, a username, a numeric id or a group slug and
 * returns the identifier the Facebook service expects.
 */
export const parseFacebookTarget = (input: string, target: TFacebookTarget) => {
  const value = input.trim()
  if (!value) return ""
  if (!/facebook\.com/i.test(value)) return value

  if (target === "GROUP") {
    return value.match(FACEBOOK_GROUP_URL_PATTERN)?.[1] ?? value
  }
  const byId = value.match(FACEBOOK_PROFILE_ID_URL_PATTERN)?.[1]
  if (byId) return byId
  const byUsername = value.match(FACEBOOK_USERNAME_URL_PATTERN)?.[1]
  if (byUsername && byUsername !== "profile.php") return byUsername
  return value
}

export const splitUrlLines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
