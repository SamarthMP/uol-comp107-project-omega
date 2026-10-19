import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import RequireAuth from "./components/auth/require-auth";
import { AuthProvider } from "./hooks/use-auth";
import { EmailFeatureProvider } from "./hooks/use-email-feature";
import useTheme from "./hooks/use-theme";
import "./index.css";
import "./lib/i18n";
import routes from "./lib/routes";
import TwoFactor from "./pages/auth/2fa";
import ForgotPassword from "./pages/auth/forgot-password";
import ResetPassword from "./pages/auth/reset-password";
import SignIn from "./pages/auth/signin";
import SignUp from "./pages/auth/signup";
import VerifyEmail from "./pages/auth/verify-email";
import Landing from "./pages/landing/landing";
import Home from "./pages/spa/home";
import SPALayout from "./pages/spa/layout";
import Permissions from "./pages/spa/permissions";
import Settings from "./pages/spa/settings";

createRoot(document.getElementById("root")!).render(
    <RootLayout />,
);

function RootLayout() {

    const theme = useTheme();

    return (
        <EmailFeatureProvider>
            <AuthProvider>
                <div className="h-screen overflow-hidden">
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<Landing />} />
                            <Route path={routes.SIGN_IN} element={<SignIn />} />
                            <Route path={routes.TWO_FACTOR} element={<TwoFactor />} />
                            <Route path={routes.SIGN_UP} element={<SignUp />} />
                            <Route path={routes.FORGOT_PASSWORD} element={<ForgotPassword />} />
                            <Route path={routes.RESET_PASSWORD} element={<ResetPassword />} />
                            <Route path={routes.VERIFY_EMAIL} element={<RequireAuth><VerifyEmail /></RequireAuth>} />
                            <Route path={routes.MAIN} element={<RequireAuth><SPALayout /></RequireAuth>}>
                                <Route index element={<Home />} />
                                <Route path="settings" element={<Settings />} />
                                <Route path="permissions" element={<Permissions />} />
                            </Route>
                        </Routes>
                    </BrowserRouter>
                </div>
            </AuthProvider>
        </EmailFeatureProvider>
    );
}