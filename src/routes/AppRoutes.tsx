import { Navigate, Route, Routes } from "react-router-dom"
import PrivateRoute from "src/routes/PrivateRoute"
import { APP_ROUTES } from "src/constants/route"
import MainLayout from "src/layouts/MainLayout"
import AccountsPage from "src/pages/accounts/AccountsPage"
import ExportCookiesPage from "src/pages/cookies/ExportCookiesPage"
import ImportCookiesPage from "src/pages/cookies/ImportCookiesPage"
import FacebookDownloadAllPage from "src/pages/download-all/FacebookDownloadAllPage"
import InstagramDownloadAllPage from "src/pages/download-all/InstagramDownloadAllPage"
import ThreadsDownloadAllPage from "src/pages/download-all/ThreadsDownloadAllPage"
import XDownloadAllPage from "src/pages/download-all/XDownloadAllPage"
import DownloadSeperatePage from "src/pages/download-seperate/DownloadSeperatePage"
import NotFound from "src/pages/errors/NotFound"
import AccessTokenPage from "src/pages/facebook/AccessTokenPage"
import ExtractUIDPage from "src/pages/facebook/ExtractUIDPage"
import SettingPage from "src/pages/setting/SettingPage"

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* <Route element={<HomePage/>}  index /> */}


        {/* <Route element={<ForgotPasswordPage />} path={APP_ROUTES.AUTH.FORGOT_PASSWORD} /> */}

        <Route element={<AccessTokenPage />} path={APP_ROUTES.FACEBOOK.ACCESS_TOKEN} />
        <Route element={<ExtractUIDPage />} path={APP_ROUTES.FACEBOOK.EXTRACT_UID} />
        <Route element={<FacebookDownloadAllPage />} path={APP_ROUTES.DOWNLOAD_ALL.FACEBOOK} />


        <Route  path={APP_ROUTES.DOWNLOAD_ALL.INSTAGRAM} element={<InstagramDownloadAllPage />}/>
        <Route path={APP_ROUTES.DOWNLOAD_ALL.THREADS} element={<ThreadsDownloadAllPage />} />
        <Route path={APP_ROUTES.DOWNLOAD_ALL.X} element={<XDownloadAllPage />} />
        <Route path={APP_ROUTES.ACCOUNTS} element={<AccountsPage />} />
        <Route path={APP_ROUTES.DOWNLOAD_SEPERATE} element={<DownloadSeperatePage />} />
        <Route element={<ExportCookiesPage />} path={APP_ROUTES.COOKIES.INDEX} />
        <Route element={<ImportCookiesPage />} path={APP_ROUTES.COOKIES.IMPORT} />
        <Route element={<ExportCookiesPage />} path={APP_ROUTES.COOKIES.EXPORT} />
        <Route path={APP_ROUTES.SETTINGS} element={<SettingPage />} />

        {/* 404 Not Found */}
        <Route element={<NotFound />} path="*" />
      </Route>
    </Routes>
  )
}

export default AppRoutes
