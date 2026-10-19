const routes = {
    LANDING: "/",
    MAIN: "/spa",
    SIGN_IN: "/signin",
    SIGN_UP: "/signup",
    TWO_FACTOR: "/signin/2fa",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    VERIFY_EMAIL: "/verify-email",
} as Record<string, string>;

routes.SETTINGS = `${routes.MAIN}/settings`;
routes.PERMISSIONS = `${routes.MAIN}/permissions`;

export default routes;