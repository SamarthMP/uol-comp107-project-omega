// Helpers for WebAuthn credential serialization between browser and server.

function base64UrlToBuffer(base64url: string): ArrayBuffer {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
    const binary = atob(base64 + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Coerce server JSON (base64url strings) into the typed objects the browser WebAuthn API expects.
 */
export function coerceToCredentialCreationOptions(
    options: unknown,
): PublicKeyCredentialCreationOptions {
    const opts = structuredClone(options) as Record<string, unknown>;
    const user = opts.user as Record<string, unknown>;
    if (typeof user?.id === "string") user.id = base64UrlToBuffer(user.id as string);
    const challenge = opts.challenge;
    if (typeof challenge === "string") opts.challenge = base64UrlToBuffer(challenge);
    const excludeCredentials = opts.excludeCredentials as Array<Record<string, unknown>> | undefined;
    if (excludeCredentials) {
        for (const c of excludeCredentials) {
            if (typeof c.id === "string") c.id = base64UrlToBuffer(c.id);
        }
    }
    return opts as unknown as PublicKeyCredentialCreationOptions;
}

export function coerceToCredentialRequestOptions(
    options: unknown,
): PublicKeyCredentialRequestOptions {
    const opts = structuredClone(options) as Record<string, unknown>;
    if (typeof opts.challenge === "string") opts.challenge = base64UrlToBuffer(opts.challenge);
    const allowCredentials = opts.allowCredentials as Array<Record<string, unknown>> | undefined;
    if (allowCredentials) {
        for (const c of allowCredentials) {
            if (typeof c.id === "string") c.id = base64UrlToBuffer(c.id);
        }
    }
    return opts as unknown as PublicKeyCredentialRequestOptions;
}

/**
 * Serialize a browser Credential into a plain JSON object with base64url-encoded buffers.
 */
export function credentialToJSON(credential: Credential): Record<string, unknown> {
    const cred = credential as PublicKeyCredential;
    const response = cred.response;
    const result: Record<string, unknown> = {
        id: cred.id,
        type: cred.type,
        rawId: bufferToBase64Url(cred.rawId),
    };

    if ("attestationObject" in response) {
        const attestation = response as AuthenticatorAttestationResponse;
        result.response = {
            clientDataJSON: bufferToBase64Url(attestation.clientDataJSON),
            attestationObject: bufferToBase64Url(attestation.attestationObject),
        };
    } else {
        const assertion = response as AuthenticatorAssertionResponse;
        result.response = {
            clientDataJSON: bufferToBase64Url(assertion.clientDataJSON),
            authenticatorData: bufferToBase64Url(assertion.authenticatorData),
            signature: bufferToBase64Url(assertion.signature),
            userHandle: assertion.userHandle
                ? bufferToBase64Url(assertion.userHandle)
                : null,
        };
    }

    return result;
}
