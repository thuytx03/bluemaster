
import { Route, Routes } from "react-router-dom";
import RootLayout from "@/modules/options/layouts/RootLayout";
import HomePage from "@/modules/options/pages/HomePage";
import AccessTokenPage from "../pages/facebook/AccessTokenPage";
import CookiePage from "../pages/facebook/CookiePage";

export const Routing = () => (
    <Routes>
        <Route element={<RootLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/facebook/access-token" element={<AccessTokenPage />} />
            <Route path="/facebook/cookies" element={<CookiePage />} />
        </Route>
    </Routes>
)
