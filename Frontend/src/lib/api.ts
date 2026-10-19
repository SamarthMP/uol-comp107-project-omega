import { lastDebugBackendURL } from "./backend-config.ts";

const isDev = import.meta.env.DEV;

export function getApiRootEndpoint() {
    // It is important that when adding routes to the backend, they should be within the /api path because a cloudflare rule is what would seperate the frontend and backend routes in production.
    return getApiHost() + "/api";
}

export function getApiHost() {
    
    let apiHost = "";

    // In development, the frontend would be run from the backend
    // And the backend would inject lastDebugBackendURL to the correct host and port of the backend server
    if ((location.hostname === "localhost" || location.hostname === "127.0.0.1" || isDev) && lastDebugBackendURL) {
        apiHost = lastDebugBackendURL;
    }

    // Trim trailing slash if it exists
    if (apiHost.endsWith("/")) { apiHost = apiHost.slice(0, -1); }

    return apiHost;
}