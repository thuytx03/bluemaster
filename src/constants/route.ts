export const APP_ROUTES = {
  HOME: "/",
  AUTH:{
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password",
  },
  ACCOUNTS: "/accounts",
  FACEBOOK:{
    ACCESS_TOKEN: "/facebook/access-token",
    DOWNLOAD_SEPERATE: "/facebook/download-seperate",
    DOWNLOAD_ALL: "/facebook/download-all",
    EXTRACT_UID: "/facebook/extract-uid",
    EXPORT_UID: "/facebook/export-uid"
  },
  TIKTOK: {
    
  },
  DOWNLOAD_ALL: {
    FACEBOOK: "/download-all/facebook",
    INSTAGRAM: "/download-all/instagram",
    THREADS: "/download-all/threads",
    X: "/download-all/x"
  },
  COOKIES: {
    INDEX: '/cookies',
    IMPORT: '/cookies/import',
    EXPORT: '/cookies/export'
  },
  DOWNLOAD_SEPERATE: "/download-seperate",
  SETTINGS: "/settings"
}
