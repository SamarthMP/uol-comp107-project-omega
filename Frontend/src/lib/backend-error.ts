import i18n from "./i18n";

export type BackendErrorLike = {
    error?: string;
    error_description?: string;
    errors?: Record<string, string[]>;
};

// Translates server message keys (e.g. "backendMessages.repairJobNotFound").
// Anything else is assumed to be display text already and is returned untouched,
// so translated UI strings containing ":" or "." are never mistaken for keys.
export function translateBackendMessage(message: string): string {
    if (!message || !message.startsWith("backendMessages.")) {
        return message;
    }

    const translated = i18n.t(message);
    if (translated !== message) {
        return translated;
    }

    return message;
}

export function translateBackendError(message: string): string {
    return translateBackendMessage(message);
}

export function translateBackendValidationErrors(errors?: Record<string, string[]>): string[] {
    if (!errors) {
        return [];
    }

    return Object.values(errors)
        .flat()
        .map((message) => translateBackendMessage(message))
        .filter((message, index, messages) => Boolean(message) && messages.indexOf(message) === index);
}

export function getBackendErrorMessage(error: BackendErrorLike | null | undefined, fallback: string): string {
    const validationErrors = translateBackendValidationErrors(error?.errors);
    if (validationErrors.length > 0) {
        return validationErrors.join(" ");
    }

    // Only server message keys are shown; raw status text or empty bodies use the caller's translated fallback
    const messageKey = [error?.error_description, error?.error].find((message) => message?.startsWith("backendMessages."));
    return messageKey ? translateBackendMessage(messageKey) : fallback;
}
