import { Route, Routes } from "react-router-dom"

import { APP_ROUTES } from "src/constants/route.constants"
import MainLayout from "src/modules/shared/layouts/MainLayout"

// Modules
import ExportCookiesPage from "src/modules/cookies/pages/ExportCookiesPage"
import ImportCookiesPage from "src/modules/cookies/pages/ImportCookiesPage"
import DownloadAllPage from "src/modules/download/pages/DownloadAllPage"
import MultiUrlDownloadPage from "src/modules/download/pages/MultiUrlDownloadPage"
import AccessTokenPage from "src/modules/facebook/pages/AccessTokenPage"
import ExportUIDPage from "src/modules/facebook/pages/ExportUIDPage"
import ExtractUIDPage from "src/modules/facebook/pages/ExtractUIDPage"
import InboxPage from "src/modules/inbox/pages/InboxPage"
import SettingPage from "src/modules/settings/pages/SettingPage"
import HomePage from "src/modules/shared/pages/HomePage"
import NotFound from "src/modules/shared/pages/NotFound"

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Home */}
        <Route element={<HomePage />} path={APP_ROUTES.HOME} />

        {/* Facebook Module */}
        <Route element={<AccessTokenPage />} path={APP_ROUTES.FACEBOOK.ACCESS_TOKEN} />
        <Route element={<ExtractUIDPage />} path={APP_ROUTES.FACEBOOK.EXTRACT_UID} />
        <Route element={<ExportUIDPage />} path={APP_ROUTES.FACEBOOK.EXPORT_UID} />

        {/* Download Module */}
        <Route element={<DownloadAllPage />} path={APP_ROUTES.DOWNLOAD_ALL.FACEBOOK} />
        <Route element={<MultiUrlDownloadPage />} path={APP_ROUTES.MULTI_URL_DOWNLOAD} />

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
