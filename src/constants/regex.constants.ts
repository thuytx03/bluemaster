import { ESingleDownloadType } from "src/constants/enum"

/**
 * URL patterns for the multi-URL downloader. Group 1 of the first matching
 * pattern is used as the display id (except post media, see url.util).
 */
export const SINGLE_DOWNLOAD_URL_PATTERNS: Record<ESingleDownloadType, RegExp[]> = {
  [ESingleDownloadType.FACEBOOK_COMMENT_VIDEO]: [
    /facebook\.com\/.*[?&]comment_id=(\d+)/
  ],
  [ESingleDownloadType.FACEBOOK_POST_MEDIA]: [
    /facebook\.com\/(permalink|story)\.php\?([^#]+)/,
    /facebook\.com\/([a-zA-Z0-9.]+)\/posts\/([a-zA-Z0-9]+)\/?/,
    /facebook\.com\/groups\/([a-zA-Z0-9.]+)\/\?multi_permalinks=(\d+).*/,
    /facebook\.com\/groups\/([a-zA-Z0-9.]+)\/posts\/(\d+)\/?/,
    /facebook\.com\/groups\/([a-zA-Z0-9.]+)\/permalink\/(\d+)\/?/
  ],
  [ESingleDownloadType.FACEBOOK_VIDEO]: [
    /facebook\.com\/(?:(?:[^/]+\/videos\/(?:[^/]+\/)?|reel\/|watch\/?\?v=)(\d+))/
  ],
  [ESingleDownloadType.FACEBOOK_HIGHLIGHT_STORY]: [
    /facebook\.com\/stories\/([\w-]+)/
  ],
  [ESingleDownloadType.FACEBOOK_ALBUM_MEDIA]: [
    /facebook\.com\/media\/set(?:\/)?\?(?:[^#]*&)?set=(?:a|oa)\.(\d+)(?:[&#]|$)/i
  ]
}

/** Facebook profile / group URL → username, numeric id or group slug */
export const FACEBOOK_PROFILE_ID_URL_PATTERN =
  /facebook\.com\/profile\.php\?(?:[^#]*&)?id=(\d+)/i
export const FACEBOOK_GROUP_URL_PATTERN =
  /facebook\.com\/groups\/([A-Za-z0-9._-]+)/i
export const FACEBOOK_USERNAME_URL_PATTERN =
  /facebook\.com\/([A-Za-z0-9._-]+)\/?(?:[?#].*)?$/i
