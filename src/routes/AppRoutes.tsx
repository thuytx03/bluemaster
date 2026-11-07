import { Navigate, Route, Routes } from "react-router-dom"

import { APP_ROUTES } from "src/constants/route.constants"
import FbFollowingPage from "src/modules/account/pages/FollowingPage"
import FbFriendsPage from "src/modules/account/pages/FriendsPage"
import FbGroupsPage from "src/modules/account/pages/GroupsPage"
import AutoBotCommentPage from "src/modules/automation/pages/AutoBotCommentPage"
import CommentHunterPage from "src/modules/automation/pages/CommentHunterPage"
import MaxPowerSharePage from "src/modules/automation/pages/MaxPowerSharePage"
import PostCampaignPage from "src/modules/automation/pages/PostCampaignPage"
import PostRadarPage from "src/modules/automation/pages/PostRadarPage"
import DownloadMessagesPage from "src/modules/content/pages/DownloadMessagesPage"
import PostsPage from "src/modules/content/pages/PostsPage"
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
import MainLayout from "src/modules/shared/layouts/MainLayout"
import HomePage from "src/modules/shared/pages/HomePage"
import NotFound from "src/modules/shared/pages/NotFound"

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Home */}
        <Route element={<HomePage />} path={APP_ROUTES.HOME} />

        {/* Facebook Module */}
        <Route
          element={<AccessTokenPage />}
          path={APP_ROUTES.FACEBOOK.ACCESS_TOKEN}
        />
        <Route
          element={<ExtractUIDPage />}
          path={APP_ROUTES.FACEBOOK.EXTRACT_UID}
        />
        <Route
          element={<ExportUIDPage />}
          path={APP_ROUTES.FACEBOOK.EXPORT_UID}
        />

        {/* Facebook account manager (ported from xthuy-social) */}
        <Route element={<FbFriendsPage />} path={APP_ROUTES.FACEBOOK.FRIENDS} />
        <Route
          element={<FbFollowingPage />}
          path={APP_ROUTES.FACEBOOK.FOLLOWING}
        />
        <Route element={<FbGroupsPage />} path={APP_ROUTES.FACEBOOK.GROUPS} />
        {/* Tools merged into the hubs above: keep old links working */}
        <Route
          element={
            <Navigate
              replace
              to={`${APP_ROUTES.FACEBOOK.FRIENDS}?tab=requests`}
            />
          }
          path={APP_ROUTES.FACEBOOK.FRIEND_REQUESTS}
        />
        <Route
          element={
            <Navigate replace to={`${APP_ROUTES.FACEBOOK.FRIENDS}?tab=sent`} />
          }
          path={APP_ROUTES.FACEBOOK.OUTGOING_REQUESTS}
        />
        <Route
          element={
            <Navigate
              replace
              to={`${APP_ROUTES.FACEBOOK.FOLLOWING}?tab=liked`}
            />
          }
          path={APP_ROUTES.FACEBOOK.LIKED_PAGES}
        />
        <Route
          element={
            <Navigate
              replace
              to={`${APP_ROUTES.FACEBOOK.GROUPS}?tab=suggested`}
            />
          }
          path={APP_ROUTES.FACEBOOK.SUGGESTED_GROUPS}
        />

        {/* Content + automation tools (ported from xthuy-social) */}
        <Route element={<PostsPage />} path={APP_ROUTES.FACEBOOK.POSTS} />
        <Route
          element={<DownloadMessagesPage />}
          path={APP_ROUTES.FACEBOOK.DOWNLOAD_MESSAGES}
        />
        <Route
          element={<PostRadarPage />}
          path={APP_ROUTES.FACEBOOK.POST_RADAR}
        />
        <Route
          element={<CommentHunterPage />}
          path={APP_ROUTES.FACEBOOK.COMMENT_HUNTER}
        />
        <Route
          element={<PostCampaignPage />}
          path={APP_ROUTES.FACEBOOK.POST_CAMPAIGN}
        />
        <Route
          element={<MaxPowerSharePage />}
          path={APP_ROUTES.FACEBOOK.MAX_POWER_SHARE}
        />
        <Route
          element={<AutoBotCommentPage />}
          path={APP_ROUTES.FACEBOOK.AUTO_BOT_COMMENT}
        />

        {/* Download Module */}
        <Route
          element={<DownloadAllPage />}
          path={APP_ROUTES.DOWNLOAD_ALL.FACEBOOK}
        />
        <Route
          element={<MultiUrlDownloadPage />}
          path={APP_ROUTES.MULTI_URL_DOWNLOAD}
        />

        {/* Cookies Module */}
        <Route
          element={<ExportCookiesPage />}
          path={APP_ROUTES.COOKIES.INDEX}
        />
        <Route
          element={<ImportCookiesPage />}
          path={APP_ROUTES.COOKIES.IMPORT}
        />
        <Route
          element={<ExportCookiesPage />}
          path={APP_ROUTES.COOKIES.EXPORT}
        />

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
