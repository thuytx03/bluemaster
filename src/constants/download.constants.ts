import { ESingleDownloadType } from "src/constants/enum"
import {
  TFacebookDownloadAllType,
  TFacebookTarget,
  TFileNameToken
} from "src/modules/download/types/download.types"

/** Every token that may appear in a file name, in display order */
export const FILE_NAME_CONFIG_DEFAULT_OPTIONS: TFileNameToken[] = [
  "numericalOrder",
  "id",
  "title",
  "timestamp"
]

/** Default format for bulk downloads */
export const DEFAULT_BULK_FILE_NAME_FORMAT: TFileNameToken[] = [
  "numericalOrder",
  "id"
]

/** Default format for single downloads (before the user configures anything) */
export const DEFAULT_SINGLE_FILE_NAME_FORMAT: TFileNameToken[] = ["id"]

export const DEFAULT_CONCURRENCY_PROCESS_LIMIT = 5
export const DOWNLOAD_STORIES_IN_HIGHLIGHT_BATCH_SIZE = 15
export const MAX_TITLE_LENGTH_IN_FILE_NAME = 80

/** i18n keys for every token */
export const FILE_NAME_TOKEN_LABEL: Record<TFileNameToken, string> = {
  numericalOrder: "file_name_token_numerical_order",
  id: "file_name_token_id",
  title: "file_name_token_title",
  timestamp: "file_name_token_timestamp"
}

export const FACEBOOK_DOWNLOAD_ALL_TYPE_OPTIONS: Record<
  TFacebookTarget,
  { value: TFacebookDownloadAllType; label: string }[]
> = {
  PROFILE: [
    { value: "PHOTO", label: "photo_label" },
    { value: "VIDEO", label: "video_label" },
    { value: "REEL", label: "reel_label" },
    { value: "HIGHLIGHT", label: "highlight_label" },
    { value: "STORY", label: "story_label" }
  ],
  GROUP: [
    { value: "PHOTO", label: "photo_label" },
    { value: "VIDEO", label: "video_label" }
  ]
}

/** Which bulk types expose which option */
export const BULK_TYPES_WITH_FILE_NAME_FORMAT: TFacebookDownloadAllType[] = [
  "PHOTO",
  "VIDEO",
  "REEL",
  "HIGHLIGHT",
  "STORY"
]
export const BULK_TYPES_WITH_TITLE_AND_TIMESTAMP: TFacebookDownloadAllType[] = [
  "VIDEO",
  "REEL"
]
export const BULK_TYPES_WITH_DATE_FILTER: TFacebookDownloadAllType[] = [
  "VIDEO",
  "REEL"
]
export const BULK_TYPES_WITH_FOLDER_STRUCTURE: TFacebookDownloadAllType[] = [
  "HIGHLIGHT"
]

export interface ISingleDownloadTypeMeta {
  type: ESingleDownloadType
  /** i18n key for the human-readable label */
  label: string
  /** Tokens the user may pick for this type in Settings */
  fileNameOptions: TFileNameToken[]
  /** Example URLs shown in the validator panel */
  urlExamples: string[]
}

/** Detection order matters: the comment-video pattern must win over post/video patterns */
export const SINGLE_DOWNLOAD_TYPES: ISingleDownloadTypeMeta[] = [
  {
    type: ESingleDownloadType.FACEBOOK_COMMENT_VIDEO,
    label: "facebook_comment_video_label",
    fileNameOptions: ["id"],
    urlExamples: [
      "https://www.facebook.com/john.doe/posts/xyz789?comment_id=1234567890",
      "https://www.facebook.com/john.doe/videos/1234567890/?comment_id=123&reply_comment_id=456"
    ]
  },
  {
    type: ESingleDownloadType.FACEBOOK_POST_MEDIA,
    label: "facebook_post_label",
    fileNameOptions: ["id", "title", "timestamp"],
    urlExamples: [
      "https://www.facebook.com/permalink.php?story_fbid=ABC123&id=1234567890",
      "https://www.facebook.com/story.php?story_fbid=ABC123&id=1234567890",
      "https://www.facebook.com/john.doe/posts/xyz789",
      "https://www.facebook.com/groups/my.group/?multi_permalinks=1234567890",
      "https://www.facebook.com/groups/my.group/posts/9876543210",
      "https://www.facebook.com/groups/my.group/permalink/9876543210"
    ]
  },
  {
    type: ESingleDownloadType.FACEBOOK_VIDEO,
    label: "facebook_video_label",
    fileNameOptions: ["id", "title", "timestamp"],
    urlExamples: [
      "https://www.facebook.com/username/videos/1234567890",
      "https://www.facebook.com/reel/1234567890",
      "https://www.facebook.com/watch?v=1234567890"
    ]
  },
  {
    type: ESingleDownloadType.FACEBOOK_HIGHLIGHT_STORY,
    label: "facebook_story_label",
    fileNameOptions: ["id", "title"],
    urlExamples: ["https://www.facebook.com/stories/abc-123-def-456"]
  },
  {
    type: ESingleDownloadType.FACEBOOK_ALBUM_MEDIA,
    label: "facebook_album_label",
    fileNameOptions: ["numericalOrder", "id"],
    urlExamples: [
      "https://www.facebook.com/media/set/?set=a.1234567890",
      "https://www.facebook.com/media/set?set=oa.9876543210&pnref=story"
    ]
  }
]

export const SINGLE_DOWNLOAD_TYPE_META: Record<
  ESingleDownloadType,
  ISingleDownloadTypeMeta
> = SINGLE_DOWNLOAD_TYPES.reduce(
  (acc, meta) => {
    acc[meta.type] = meta
    return acc
  },
  {} as Record<ESingleDownloadType, ISingleDownloadTypeMeta>
)

/** Root folder (inside the browser's Downloads folder) for everything we save */
export const DOWNLOAD_ROOT_FOLDER = "bluemaster"
