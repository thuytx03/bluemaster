import { EDownloadSeperateType } from "src/constants/enum"

export const IG_DOWNLOAD_ALL_TYPE = [
  { label: 'post_label', value: "POST" },
  { label: 'reel_label', value: "REEL" },
  { label: 'highlight_label', value: "HIGHLIGHT" },
  { label: 'story_label', value: "STORY" }
]

export const THREADS_DOWNLOAD_ALL_TYPE = [
  { label: 'threads_post_label', value: "POST" }
]

export const X_DOWNLOAD_ALL_TYPE = [
  { label: 'media_label', value: "MEDIA" }
]

export const FB_DOWNLOAD_ALL_TYPE = {
  PROFILE: [
    { label: 'photo_label', value: "PHOTO" },
    { label: 'video_label', value: "VIDEO" },
    { label: 'reel_label', value: "REEL" },
    { label: 'highlight_label', value: "HIGHLIGHT" },
    { label: 'album_by_id_label', value: "ALBUM_BY_ID" }
  ],
  GROUP: [
    { label: 'photo_label', value: "PHOTO" },
    { label: 'video_label', value: "VIDEO" },
    { label: 'album_by_id_label', value: "ALBUM_BY_ID" }
  ]
}

export const DOWNLOAD_SEPARATELY_TYPE = [
  { label: 'post_label', value: "POST" },
  { label: 'reel_label', value: "REEL" },
  { label: 'highlight_label', value: "HIGHLIGHT" },
  { label: 'story_label', value: "STORY" },
  { label: 'avatar_label', value: "AVATAR" }
]

export const DOWNLOAD_SEPERATE_TYPE_OPTIONS = [
  {
    group: "Facebook",
    options: [
      {
        label: 'facebook_post_label',
        value: EDownloadSeperateType.FACEBOOK_POST
      },
      {
        label: 'facebook_reel_label',
        value: EDownloadSeperateType.FACEBOOK_REEL
      },
      {
        label: 'facebook_video_label',
        value: EDownloadSeperateType.FACEBOOK_VIDEO
      },
      {
        label: 'facebook_story_label',
        value: EDownloadSeperateType.FACEBOOK_STORY
      },
      {
        label: 'facebook_comment_video_label',
        value: EDownloadSeperateType.FACEBOOK_COMMENT_VIDEO
      }
    ]
  },
  {
    group: "Instagram",
    options: [
      {
        label: 'instagram_post_label',
        value: EDownloadSeperateType.INSTAGRAM_POST
      },
      {
        label: 'instagram_reel_label',
        value: EDownloadSeperateType.INSTAGRAM_REEL
      },
      {
        label: 'instagram_highlight_label',
        value: EDownloadSeperateType.INSTAGRAM_HIGHLIGHT
      }
    ]
  },
  {
    group: "Threads",
    options: [
      {
        label: 'threads_post_label',
        value: EDownloadSeperateType.THREADS_POST
      }
    ]
  },
  {
    group: "X",
    options: [
      {
        label: 'x_post_label',
        value: EDownloadSeperateType.X_POST
      }
    ]
  }
]

export const DOWNLOAD_TYPE_TAG_COLOR = {
  POST: "blue",
  REEL: "green",
  HIGHLIGHT: "gold",
  STORY: "purple",
  VIDEO: "red",
  PHOTO: "cyan",
  MEDIA: "magenta",
  ALBUM_BY_ID: "lime"
}

export const PROCESS_STATUS_TAG_COLOR = {
  RUNNING: "blue",
  COMPLETED: "green",
  FAILED: "red"
}

export const PROCESS_TEXT = {
  RUNNING: 'running_text',
  COMPLETED: 'completed_text',
  FAILED: 'failed_text'
}

export const DOWNLOAD_STORIES_IN_HIGHLIGHT_BATCH_SIZE = 15
export const REQUEST_ACCEPT_HEADER =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
export const MAX_RETRY_REQUEST = 15
