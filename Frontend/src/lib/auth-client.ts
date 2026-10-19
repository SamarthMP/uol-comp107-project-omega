import { getApiHost, getApiRootEndpoint } from "./api";
import type {
    ErrorResponse,
    TokenResponse,
    UserProfile
} from "./auth-types";
import i18n from "./i18n";
import routes from "./routes";

const TOKEN_KEY = "auth_access_token";
const REFRESH_KEY = "auth_refresh_token";
const EXPIRY_KEY = "auth_token_expiry";
const USER_KEY = "auth_user_profile";
const DEMO_GRANT_TYPE = "urn:custom:demo";

// Sessions are scoped to the browser session: each tab/session gets its own demo account,
// which survives page refreshes but not closing the tab.
const sessionStore = window.sessionStorage;

let redirectingToSignIn = false;

// Leaves the app with a full page load, so no stale state survives into the next demo session
export function redirectToSignIn() {
    redirectingToSignIn = true;
    window.location.href = routes.SIGN_IN;
}

// True while a full-page redirect is in flight, so nothing starts a new session before the reload
export function isRedirectingToSignIn() {
    return redirectingToSignIn;
}

type AuthRequestError = ErrorResponse & {
    status?: number;
    transient?: boolean;
    sessionExpired?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function toAuthRequestError(error: unknown, fallback: string): AuthRequestError {
    if (isRecord(error)) {
        const normalized = {
            error: fallback,
            ...(error as Record<string, unknown>),
        } as unknown as AuthRequestError;
        normalized.error = typeof error.error === "string" ? error.error : fallback;
        if (typeof error.error_description === "string") {
            normalized.error_description = error.error_description;
        }
        if (typeof error.status === "number") {
            normalized.status = error.status;
        }
        if (error.transient === true) {
            normalized.transient = true;
        }
        if (error.sessionExpired === true) {
            normalized.sessionExpired = true;
        }
        return normalized;
    }

    if (error instanceof Error) {
        return {
            error: error.message || fallback,
            transient: true,
        };
    }

    return {
        error: fallback,
        transient: true,
    };
}

function buildResponseError(response: Response, error: unknown): AuthRequestError {
    const normalized = toAuthRequestError(error, response.statusText || i18n.t("common.unknownError"));
    normalized.status = response.status;
    return normalized;
}

export function isSessionExpiredError(error: unknown): boolean {
    return isRecord(error) && error.sessionExpired === true;
}

export function getStoredToken(): string | null {
    return sessionStore.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
    return sessionStore.getItem(REFRESH_KEY);
}

export function getStoredUser(): UserProfile | null {
    const storedUser = sessionStore.getItem(USER_KEY);
    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser) as UserProfile;
    } catch {
        sessionStore.removeItem(USER_KEY);
        return null;
    }
}

export function storeUser(user: UserProfile) {
    sessionStore.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
    sessionStore.removeItem(USER_KEY);
}

function storeTokens(access: string, refresh: string, expiresIn?: number) {
    sessionStore.setItem(TOKEN_KEY, access);
    sessionStore.setItem(REFRESH_KEY, refresh);
    if (expiresIn != null) {
        sessionStore.setItem(EXPIRY_KEY, String(Date.now() + expiresIn * 1000));
    }
}

function isTokenExpiringSoon(): boolean {
    const expiry = sessionStore.getItem(EXPIRY_KEY);
    if (!expiry) return false;
    // Consider expired if within 2 minutes of expiry
    return Date.now() >= Number(expiry) - 120_000;
}

export function clearTokens() {
    sessionStore.removeItem(TOKEN_KEY);
    sessionStore.removeItem(REFRESH_KEY);
    sessionStore.removeItem(EXPIRY_KEY);
    clearStoredUser();
}


async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
    let res: Response;
    try {
        res = await fetch(`${getApiRootEndpoint()}/auth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(params),
        });
    } catch (error) {
        throw toAuthRequestError(error, i18n.t("errors.somethingWentWrong"));
    }

    const data = await res.json().catch(() => ({ error: res.statusText }));
    if (!res.ok) throw buildResponseError(res, data);
    return data;
}

export async function request<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const url = `${getApiRootEndpoint()}${path}`;
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> | undefined),
    };
    const token = await getFreshAccessToken();

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    let res: Response;
    try {
        res = await fetch(url, { ...options, headers });
    } catch (error) {
        throw toAuthRequestError(error, i18n.t("errors.somethingWentWrong"));
    }

    if (res.status === 401 && token) {
        const refreshed = await tryRefresh();
        if (refreshed === "success") {
            headers["Authorization"] = `Bearer ${getStoredToken()}`;
            let retry: Response;
            try {
                retry = await fetch(url, { ...options, headers });
            } catch (error) {
                throw toAuthRequestError(error, i18n.t("errors.somethingWentWrong"));
            }
            if (!retry.ok) {
                const err = await retry.json().catch(() => ({ error: retry.statusText }));
                throw buildResponseError(retry, err);
            }
            if (retry.status === 204) return undefined as T;
            return retry.json() as Promise<T>;
        }

        if (refreshed === "invalid") {
            clearTokens();
            redirectToSignIn();
            throw {
                error: i18n.t("errors.sessionExpired"),
                status: 401,
                sessionExpired: true,
            } satisfies AuthRequestError;
        }
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw buildResponseError(res, err);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

async function tryRefresh(): Promise<"success" | "invalid" | "unavailable"> {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return "invalid";
    try {
        const data = await tokenRequest({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            scope: "offline_access",
        });
        storeTokens(data.access_token, data.refresh_token, data.expires_in);
        return "success";
    } catch (error) {
        const normalized = toAuthRequestError(error, i18n.t("errors.sessionExpired"));
        if (normalized.transient) {
            return "unavailable";
        }
        if (normalized.status === 400 || normalized.status === 401 || normalized.error === "invalid_grant") {
            return "invalid";
        }
        return "unavailable";
    }
}

// Returns the current access token, refreshing it first if it is about to expire.
// Used by fetch requests and the realtime connection.
export async function getFreshAccessToken(): Promise<string | null> {
    if (getStoredToken() && isTokenExpiringSoon()) {
        await tryRefresh();
    }

    return getStoredToken();
}

// Creates a brand new passwordless "Demo User NNNN" account and signs into it
export async function startDemoSession() {
    const data = await tokenRequest({
        grant_type: DEMO_GRANT_TYPE,
        scope: "offline_access",
    });
    storeTokens(data.access_token, data.refresh_token, data.expires_in);
    return data;
}

export async function clearSession() {
    try {
        await request("/auth/signout", { method: "POST" });
    } finally {
        clearTokens();
    }
}

export function getMe() {
    return request<UserProfile>("/auth/me");
}

export function updateProfile(displayName: string) {
    return request<UserProfile>("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ displayName }),
    });
}

export function resolveUrl(url: string) {
    if (url.startsWith("/")) {
        return `${getApiHost()}${url}`;
    }
    else if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    return `${getApiRootEndpoint()}/${url}`;
}

export function uploadProfilePicture(file: Blob) {
    const form = new FormData();
    form.append("file", file);
    return request<UserProfile>("/auth/pfp/upload", {
        method: "POST",
        body: form,
    });
}

export function setProfilePictureUrl(url: string) {
    return request<UserProfile>("/auth/pfp/url", {
        method: "POST",
        body: JSON.stringify({ url }),
    });
}
