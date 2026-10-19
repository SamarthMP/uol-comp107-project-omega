import { lastDebugBackendURL } from "./backend-config.ts";

const isDev = import.meta.env.DEV;

export function getApiRootEndpoint() {
    // It is important that when adding routes to the backend, they should be within the /api path because a cloudflare rule is what would seperate the frontend and backend routes in production.
    return getApiHost() + "/api";
}

export function getApiHost() {
    
    let apiHost = "";

    // In development, the Vite dev server runs separately from the backend,
    // and the backend injects lastDebugBackendURL with its host and port.
    // Production builds are served by the backend itself, so they always use the same origin.
    if (isDev && lastDebugBackendURL) {
        apiHost = lastDebugBackendURL;
    }

    // Trim trailing slash if it exists
    if (apiHost.endsWith("/")) { apiHost = apiHost.slice(0, -1); }

    return apiHost;
}