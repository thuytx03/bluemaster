export const APP_ROUTES = {
  HOME: "/",
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password"
  },
  FACEBOOK: {
    ACCESS_TOKEN: "/facebook/access-token",
    EXTRACT_UID: "/facebook/extract-uid",
    EXPORT_UID: "/facebook/export-uid",
    FRIENDS: "/facebook/friends",
    FRIEND_REQUESTS: "/facebook/friend-requests",
    OUTGOING_REQUESTS: "/facebook/outgoing-requests",
    FOLLOWING: "/facebook/following",
    LIKED_PAGES: "/facebook/liked-pages",
    GROUPS: "/facebook/groups",
    SUGGESTED_GROUPS: "/facebook/suggested-groups",
    POSTS: "/facebook/posts",
    DOWNLOAD_MESSAGES: "/facebook/download-messages",
    POST_RADAR: "/facebook/post-radar",
    COMMENT_HUNTER: "/facebook/comment-hunter",
    POST_CAMPAIGN: "/facebook/post-campaign",
    MAX_POWER_SHARE: "/facebook/max-power-share",
    AUTO_BOT_COMMENT: "/facebook/auto-bot-comment"
  },
  DOWNLOAD_ALL: {
    FACEBOOK: "/download-all/facebook"
  },
  MULTI_URL_DOWNLOAD: "/download/multi-url",
  COOKIES: {
    INDEX: "/cookies",
    IMPORT: "/cookies/import",
    EXPORT: "/cookies/export"
  },
  SETTINGS: "/settings",
  INBOX: "/inbox"
}
