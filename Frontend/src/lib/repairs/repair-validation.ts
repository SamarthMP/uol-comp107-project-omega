import { translateBackendMessage } from "../backend-error";

export type TextProblem = "required" | "whitespace" | "tooLong";

// Checks a required free-text value. Whitespace-only text is treated as empty.
export function checkRequiredText(value: string, maxLength: number): TextProblem | null {
    if (value.length === 0) return "required";
    if (value.trim().length === 0) return "whitespace";
    if (value.trim().length > maxLength) return "tooLong";
    return null;
}

// Maps server validation errors (keyed by request property, e.g. "Description" or "$.description")
// to translated messages keyed by lower-cased field name.
export function mapServerFieldErrors(errors?: Record<string, string[]>): Record<string, string> {
    if (!errors) return {};

    return Object.fromEntries(
        Object.entries(errors)
            .filter(([, messages]) => messages.length > 0)
            .map(([key, messages]) => [key.replace(/^\$\./, "").toLowerCase(), translateBackendMessage(messages[0])])
    );
}
