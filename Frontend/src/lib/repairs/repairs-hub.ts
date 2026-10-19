import { HubConnectionBuilder, LogLevel, type HubConnection } from "@microsoft/signalr";
import { getApiRootEndpoint } from "../api";
import { getFreshAccessToken } from "../auth-client";

const HUB_PATH = "/hubs/repairs";
const MAX_RECONNECT_DELAY_MS = 15_000;

export const HUB_EVENTS = {
    jobChanged: "JobChanged",
    presenceChanged: "PresenceChanged",
} as const;

export const HUB_METHODS = {
    viewJob: "ViewJob",
    refreshProfile: "RefreshProfile",
} as const;

// Builds the realtime connection to the repairs hub. It keeps retrying with backoff
// forever, so a brief backend restart or network blip recovers on its own.
export function createRepairsConnection(): HubConnection {
    return new HubConnectionBuilder()
        .withUrl(`${getApiRootEndpoint()}${HUB_PATH}`, {
            accessTokenFactory: async () => (await getFreshAccessToken()) ?? "",
            // Authentication uses bearer tokens rather than cookies
            withCredentials: false,
        })
        .withAutomaticReconnect({
            nextRetryDelayInMilliseconds: (context) => Math.min(1000 * 2 ** context.previousRetryCount, MAX_RECONNECT_DELAY_MS),
        })
        .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
        .build();
}
