import i18n from "./i18n";

export type BackendErrorLike = {
    error?: string;
    error_description?: string;
    errors?: Record<string, string[]>;
};

export function translateBackendMessage(message: string): string {
    if (!message) {
        return message;
    }

    const key = message.startsWith("backendMessages.") ? message : `backendMessages.${message}`;
    const translated = i18n.t(key);
    if (translated !== key) {
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

    return error?.error_description ?? error?.error ?? fallback;
}
