export interface UserProfile {
    id: string;
    email: string;
    displayName: string | null;
    profilePictureUrl: string | null;
    isTotpEnabled: boolean;
    isEmailVerified: boolean;
    hasPasskeys: boolean;
    hasExternalLogin: boolean;
    hasPassword: boolean;
    permissions: string[];
}

export interface TotpSetupResponse {
    sharedKey: string;
    authenticatorUri: string;
}

export interface PasskeyInfo {
    id: string;
    name: string;
    createdAt: string;
}

export interface ErrorResponse {
    error: string;
    error_description?: string;
    errors?: Record<string, string[]>;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

export interface ExternalProviderInfo {
    id: string;
    displayName: string;
    iconURL: string | null;
    accentColor: string | null;
    textColor: string | null;
}

export type SecurityCheckpointMethod = "password" | "totp" | "passkey";

export interface SecurityCheckpointIdentity {
    displayName: string | null;
    profilePictureUrl: string | null;
    email?: string | null;
}

export interface TwoFactorRequiredResponse extends ErrorResponse {
    methods?: SecurityCheckpointMethod[];
    displayName?: string | null;
    profilePictureUrl?: string | null;
    twoFactorId?: string;
}

export interface PendingTwoFactorSession extends SecurityCheckpointIdentity {
    twoFactorId: string;
    methods: SecurityCheckpointMethod[];
}

export interface AuthConfigResponse {
    emailEnabled: boolean;
    providers: ExternalProviderInfo[];
}
