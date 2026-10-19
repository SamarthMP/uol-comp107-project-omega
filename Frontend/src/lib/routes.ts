const routes = {
    LANDING: "/",
    MAIN: "/spa",
    SIGN_IN: "/signin",
    SIGN_UP: "/signup",
} as Record<string, string>;

routes.JOBS = `${routes.MAIN}/jobs`;
routes.SETTINGS = `${routes.MAIN}/settings`;
routes.PERMISSIONS = `${routes.MAIN}/permissions`;

export function jobRoute(jobId: number) {
    return `${routes.JOBS}/${jobId}`;
}

export default routes;
