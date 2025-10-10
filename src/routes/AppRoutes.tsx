import { Navigate, Route, Routes } from "react-router-dom"
import { APP_ROUTES } from "src/constants/route"
import MainLayout from "src/layouts/MainLayout"
import AccountsPage from "src/pages/accounts/AccountsPage"
import CookiePage from "src/pages/cookies/CookiesPage"
import FacebookDownloadAllPage from "src/pages/download-all/FacebookDownloadAllPage"
import InstagramDownloadAllPage from "src/pages/download-all/InstagramDownloadAllPage"
import ThreadsDownloadAllPage from "src/pages/download-all/ThreadsDownloadAllPage"
import XDownloadAllPage from "src/pages/download-all/XDownloadAllPage"
import DownloadSeperatePage from "src/pages/download-seperate/DownloadSeperatePage"
import AccessTokenPage from "src/pages/facebook/AccessTokenPage"
import ExtractUIDPage from "src/pages/facebook/ExtractUIDPage"
import SettingPage from "src/pages/setting/SettingPage"

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route element={<Navigate to={APP_ROUTES.DOWNLOAD_ALL.FACEBOOK} />} index />
        
        <Route element={<AccessTokenPage />} path={APP_ROUTES.FACEBOOK.ACCESS_TOKEN} />
        <Route element={<ExtractUIDPage />} path={APP_ROUTES.FACEBOOK.EXTRACT_UID} />


        <Route
          element={<FacebookDownloadAllPage />}
          path={APP_ROUTES.DOWNLOAD_ALL.FACEBOOK}
        />
        <Route
          path={APP_ROUTES.DOWNLOAD_ALL.INSTAGRAM}
          element={<InstagramDownloadAllPage />}
        />
        <Route
          path={APP_ROUTES.DOWNLOAD_ALL.THREADS}
          element={<ThreadsDownloadAllPage />}
        />
        <Route
          path={APP_ROUTES.DOWNLOAD_ALL.X}
          element={<XDownloadAllPage />}
        />
        <Route path={APP_ROUTES.ACCOUNTS} element={<AccountsPage />} />
        <Route
          path={APP_ROUTES.DOWNLOAD_SEPERATE}
          element={<DownloadSeperatePage />}
        />
        <Route element={<CookiePage />} path={APP_ROUTES.COOKIES} />
        <Route path={APP_ROUTES.SETTINGS} element={<SettingPage />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
