import { lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import RequireAuth from "./components/auth/require-auth";
import { AuthProvider } from "./hooks/use-auth";
import useTheme from "./hooks/use-theme";
import "./index.css";
import "./lib/i18n";
import routes from "./lib/routes";
import DemoSession from "./pages/auth/demo-session";
import SPALayout from "./pages/spa/layout";
import RepairsPage from "./pages/spa/repairs";

// Secondary pages are split out so the repairs board loads as quickly as possible
const Settings = lazy(() => import("./pages/spa/settings"));
const Permissions = lazy(() => import("./pages/spa/permissions"));

createRoot(document.getElementById("root")!).render(
    <RootLayout />,
);

function RootLayout() {

    useTheme();

    return (
        <AuthProvider>
            <div className="h-dvh overflow-hidden">
                <BrowserRouter>
                    <Routes>
                        <Route path={routes.LANDING} element={<Navigate to={routes.MAIN} replace />} />
                        <Route path={routes.SIGN_IN} element={<DemoSession />} />
                        <Route path={routes.SIGN_UP} element={<Navigate to={routes.SIGN_IN} replace />} />
                        <Route path={routes.MAIN} element={<RequireAuth><SPALayout /></RequireAuth>}>
                            <Route element={<RepairsPage />}>
                                <Route index element={null} />
                                <Route path="jobs/:jobId" element={null} />
                            </Route>
                            <Route path="settings" element={<Settings />} />
                            <Route path="permissions" element={<Permissions />} />
                        </Route>
                        <Route path="*" element={<Navigate to={routes.MAIN} replace />} />
                    </Routes>
                </BrowserRouter>
            </div>
        </AuthProvider>
    );
}
