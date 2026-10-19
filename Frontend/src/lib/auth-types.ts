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
