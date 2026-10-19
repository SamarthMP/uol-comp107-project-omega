import { getApiHost, getApiRootEndpoint } from "./api";
import type {
    AuthConfigResponse,
    ErrorResponse,
    PasskeyInfo,
    PendingTwoFactorSession,
    SecurityCheckpointMethod,
    TokenResponse,
    TotpSetupResponse,
    UserProfile
} from "./auth-types";
import i18n from "./i18n";
import routes from "./routes";

const TOKEN_KEY = "auth_access_token";
const REFRESH_KEY = "auth_refresh_token";
const EXPIRY_KEY = "auth_token_expiry";
const PENDING_TWO_FACTOR_KEY = "auth_pending_two_factor";
const USER_KEY = "auth_user_profile";

type AuthRequestError = ErrorResponse & {
    status?: number;
    transient?: boolean;
    sessionExpired?: boolean;
};

function isSecurityCheckpointMethod(value: unknown): value is SecurityCheckpointMethod {
    return value === "password" || value === "totp" || value === "passkey";
}

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
    return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): UserProfile | null {
    const storedUser = sessionStorage.getItem(USER_KEY);
    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser) as UserProfile;
    } catch {
        sessionStorage.removeItem(USER_KEY);
        return null;
    }
}

export function storeUser(user: UserProfile) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
    sessionStorage.removeItem(USER_KEY);
}

function storeTokens(access: string, refresh: string, expiresIn?: number) {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    if (expiresIn != null) {
        localStorage.setItem(EXPIRY_KEY, String(Date.now() + expiresIn * 1000));
    }
}

function isTokenExpiringSoon(): boolean {
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (!expiry) return false;
    // Consider expired if within 2 minutes of expiry
    return Date.now() >= Number(expiry) - 120_000;
}

export function clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(EXPIRY_KEY);
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
    let token = getStoredToken();

    // Proactively refresh if the token is about to expire
    if (token && isTokenExpiringSoon()) {
        const refreshed = await tryRefresh();
        if (refreshed) {
            token = getStoredToken();
        }
    }

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
            window.location.href = routes.SIGN_IN;
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

export async function signIn(email: string, password: string, totpCode?: string) {
    const params: Record<string, string> = {
        grant_type: "password",
        username: email,
        password,
        scope: "offline_access",
    };
    if (totpCode) params.totp_code = totpCode;

    const data = await tokenRequest(params);
    storeTokens(data.access_token, data.refresh_token, data.expires_in);
    return data;
}

export function storePendingTwoFactor(checkpoint: PendingTwoFactorSession) {
    sessionStorage.setItem(PENDING_TWO_FACTOR_KEY, JSON.stringify(checkpoint));
}

export function getPendingTwoFactor(): PendingTwoFactorSession | null {
    const raw = sessionStorage.getItem(PENDING_TWO_FACTOR_KEY);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as Partial<PendingTwoFactorSession>;
        if (typeof parsed.twoFactorId !== "string") {
            return null;
        }

        const methods = Array.isArray(parsed.methods)
            ? parsed.methods.filter(isSecurityCheckpointMethod)
            : [];

        return {
            twoFactorId: parsed.twoFactorId,
            methods,
            displayName: typeof parsed.displayName === "string" ? parsed.displayName : null,
            profilePictureUrl: typeof parsed.profilePictureUrl === "string" ? parsed.profilePictureUrl : null,
            email: typeof parsed.email === "string" ? parsed.email : null,
        };
    } catch {
        return null;
    }
}

export function clearPendingTwoFactor() {
    sessionStorage.removeItem(PENDING_TWO_FACTOR_KEY);
}

export async function signUp(email: string, password: string, displayName?: string) {
    await request("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, displayName }),
    });
    return signIn(email, password);
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

export function changePassword(currentPassword: string, newPassword: string) {
    return request<UserProfile>("/auth/password/change", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
    });
}

export function setPassword(newPassword: string) {
    return request<UserProfile>("/auth/password/change", {
        method: "POST",
        body: JSON.stringify({ currentPassword: "", newPassword }),
    });
}

export function setupTotp() {
    return request<TotpSetupResponse>("/auth/totp/setup", { method: "POST" });
}

export function verifyTotp(code: string) {
    return request<UserProfile>("/auth/totp/verify", {
        method: "POST",
        body: JSON.stringify({ code }),
    });
}

export function disableTotp(password: string) {
    return request<UserProfile>("/auth/totp/disable", {
        method: "POST",
        body: JSON.stringify({ password }),
    });
}

export function listPasskeys() {
    return request<PasskeyInfo[]>("/auth/passkeys");
}

export function beginPasskeyRegister() {
    return request<{ options: unknown; challengeId: string }>("/auth/passkeys/register/begin", {
        method: "POST",
    });
}

export function completePasskeyRegister(challengeId: string, name: string, attestation: unknown) {
    return request<PasskeyInfo>("/auth/passkeys/register/complete", {
        method: "POST",
        body: JSON.stringify({
            challengeId,
            name,
            attestationResponseJson: JSON.stringify(attestation),
        }),
    });
}

export function beginPasskeySignIn() {
    return request<{ options: unknown; challengeId: string }>("/auth/passkeys/signin/begin", {
        method: "POST",
    });
}

export function beginTwoFactorPasskey(twoFactorId: string) {
    return request<{ options: unknown; challengeId: string }>("/auth/2fa/passkeys/begin", {
        method: "POST",
        body: JSON.stringify({ twoFactorId }),
    });
}

export async function completePasskeySignIn(challengeId: string, assertion: unknown) {
    const data = await tokenRequest({
        grant_type: "urn:custom:passkey",
        challenge_id: challengeId,
        assertion_json: JSON.stringify(assertion),
        scope: "offline_access",
    });
    storeTokens(data.access_token, data.refresh_token, data.expires_in);
    return data;
}

export async function completeTwoFactor(
    twoFactorId: string,
    totpCode?: string,
    challengeId?: string,
    assertionJson?: string,
) {
    const params: Record<string, string> = {
        grant_type: "urn:custom:2fa",
        two_factor_id: twoFactorId,
        scope: "offline_access",
    };
    if (totpCode) params.totp_code = totpCode;
    if (challengeId) params.challenge_id = challengeId;
    if (assertionJson) params.assertion_json = assertionJson;

    const data = await tokenRequest(params);
    storeTokens(data.access_token, data.refresh_token, data.expires_in);
    return data;
}

export function deletePasskey(id: string, password: string) {
    return request<void>(`/auth/passkeys/${encodeURIComponent(id)}`, {
        method: "DELETE",
        body: JSON.stringify({ password }),
    });
}

export function getProfilePictureUrl(userId: string): string {
    return `${getApiRootEndpoint()}/auth/pfp/${encodeURIComponent(userId)}`;
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

export function deleteProfilePicture() {
    return request<UserProfile>("/auth/pfp", { method: "DELETE" });
}

export async function deleteAccount() {
    await request<void>("/auth/account", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "DELETE" }),
    });
    clearTokens();
}

export function getAuthConfig() {
    return request<AuthConfigResponse>("/auth/config");
}

export function getExternalChallengeUrl(provider: string, returnUrl?: string): string {
    const base = `${getApiRootEndpoint()}/auth/external/challenge/${encodeURIComponent(provider)}`;
    if (returnUrl) return `${base}?returnUrl=${encodeURIComponent(returnUrl)}`;
    return base;
}

export async function exchangeExternalCode(code: string) {
    const data = await tokenRequest({
        grant_type: "urn:custom:external",
        code,
        scope: "offline_access",
    });
    storeTokens(data.access_token, data.refresh_token, data.expires_in);
    return data;
}

export function getSudoMethods() {
    return request<SecurityCheckpointMethod[]>("/auth/sudo/methods");
}

export async function verifySudo(
    password?: string,
    totpCode?: string,
    challengeId?: string,
    assertionJson?: string,
) {
    const params: Record<string, string> = { grant_type: "urn:custom:sudo" };
    if (password) params.password = password;
    if (totpCode) params.totp_code = totpCode;
    if (challengeId) params.challenge_id = challengeId;
    if (assertionJson) params.assertion_json = assertionJson;

    const token = getStoredToken();
    const res = await fetch(`${getApiRootEndpoint()}/auth/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: new URLSearchParams(params),
    });
    const data = await res.json();
    if (!res.ok) throw data;

    // Store the sudo access token (short-lived, with sudo claim).
    // Keep existing refresh token, refreshing will downgrade to a regular token.
    localStorage.setItem(TOKEN_KEY, data.access_token);
    if (data.expires_in != null) {
        localStorage.setItem(EXPIRY_KEY, String(Date.now() + data.expires_in * 1000));
    }
}

export function sendVerificationEmail() {
    return request<{ message: string }>("/auth/email/verify/send", { method: "POST" });
}

export function confirmEmailVerification(code: string) {
    return request<UserProfile>("/auth/email/verify/confirm", {
        method: "POST",
        body: JSON.stringify({ code }),
    });
}

export function sendPasswordResetEmail(email: string) {
    return request<{ message: string }>("/auth/email/password-reset/send", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
}

export function confirmPasswordReset(email: string, code: string, newPassword: string) {
    return request<{ message: string }>("/auth/email/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ email, code, newPassword }),
    });
}

export function sendChangeEmail(newEmail: string) {
    return request<{ message: string }>("/auth/email/change/send", {
        method: "POST",
        body: JSON.stringify({ newEmail }),
    });
}

export function confirmChangeEmail(code: string) {
    return request<UserProfile>("/auth/email/change/confirm", {
        method: "POST",
        body: JSON.stringify({ code }),
    });
}
