import { Navigate, Route, Routes } from "react-router-dom"
import { APP_ROUTES } from "../constants/route"
import MainLayout from "../modules/shared/layouts/MainLayout"

// Modules
import AccountsPage from "../modules/accounts/pages/AccountsPage"
import ExportCookiesPage from "../modules/cookies/pages/ExportCookiesPage"
import ImportCookiesPage from "../modules/cookies/pages/ImportCookiesPage"
import DownloadSeperatePage from "../modules/download/pages/DownloadSeperatePage"
import FacebookDownloadAllPage from "../modules/facebook/pages/FacebookDownloadAllPage"
import AccessTokenPage from "../modules/facebook/pages/AccessTokenPage"
import ExtractUIDPage from "../modules/facebook/pages/ExtractUIDPage"
import ExportUIDPage from "../modules/facebook/pages/ExportUIDPage"
import InstagramDownloadAllPage from "../modules/instagram/pages/InstagramDownloadAllPage"
import SettingPage from "../modules/settings/pages/SettingPage"
import ThreadsDownloadAllPage from "../modules/threads/pages/ThreadsDownloadAllPage"
import XDownloadAllPage from "../modules/x/pages/XDownloadAllPage"
import NotFound from "../modules/shared/pages/NotFound"
import InboxPage from "../modules/facebook/pages/inbox"

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Facebook Module */}
        <Route element={<AccessTokenPage />} path={APP_ROUTES.FACEBOOK.ACCESS_TOKEN} />
        <Route element={<ExtractUIDPage />} path={APP_ROUTES.FACEBOOK.EXTRACT_UID} />
        <Route element={<ExportUIDPage />} path={APP_ROUTES.FACEBOOK.EXPORT_UID} />
        <Route element={<FacebookDownloadAllPage />} path={APP_ROUTES.DOWNLOAD_ALL.FACEBOOK} />

        {/* Instagram Module */}
        <Route path={APP_ROUTES.DOWNLOAD_ALL.INSTAGRAM} element={<InstagramDownloadAllPage />} />

        {/* Threads Module */}
        <Route path={APP_ROUTES.DOWNLOAD_ALL.THREADS} element={<ThreadsDownloadAllPage />} />

        {/* X Module */}
        <Route path={APP_ROUTES.DOWNLOAD_ALL.X} element={<XDownloadAllPage />} />

        {/* Accounts Module */}
        <Route path={APP_ROUTES.ACCOUNTS} element={<AccountsPage />} />

        {/* Download Module */}
        <Route path={APP_ROUTES.DOWNLOAD_SEPERATE} element={<DownloadSeperatePage />} />

        {/* Cookies Module */}
        <Route element={<ExportCookiesPage />} path={APP_ROUTES.COOKIES.INDEX} />
        <Route element={<ImportCookiesPage />} path={APP_ROUTES.COOKIES.IMPORT} />
        <Route element={<ExportCookiesPage />} path={APP_ROUTES.COOKIES.EXPORT} />

        {/* Inbox Module */}
        <Route path={APP_ROUTES.INBOX} element={<InboxPage />} />

        {/* Settings Module */}
        <Route path={APP_ROUTES.SETTINGS} element={<SettingPage />} />

        {/* 404 Not Found */}
        <Route element={<NotFound />} path="*" />
      </Route>
    </Routes>
  )
}

export default AppRoutes
