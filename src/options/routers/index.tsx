
import { Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import RootLayout from "../layouts/RootLayout";



export const Routing = () => (
    <Routes>
        <Route element={<RootLayout />}>
            <Route path="/" element={<HomePage />} />
        </Route>
    </Routes>
)
