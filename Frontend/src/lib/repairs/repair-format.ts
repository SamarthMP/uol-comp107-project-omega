import i18n from "../i18n";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const JUST_NOW_MS = 45 * SECOND_MS;

function locale() {
    return i18n.t("format.dateLocale");
}

// e.g. "19 Oct 2026, 10:42"
export function formatDateTime(iso: string) {
    return new Intl.DateTimeFormat(locale(), {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(iso));
}

// e.g. "19 October 2026 at 10:42:07", used for tooltips and screen readers
export function formatFullDateTime(iso: string) {
    return new Intl.DateTimeFormat(locale(), {
        dateStyle: "long",
        timeStyle: "medium",
    }).format(new Date(iso));
}

// e.g. "10:42"
export function formatTime(iso: string) {
    return new Intl.DateTimeFormat(locale(), {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(iso));
}

// e.g. "just now", "5 minutes ago", "yesterday"
export function formatRelative(iso: string, now: number) {
    const elapsed = now - new Date(iso).getTime();
    if (elapsed < JUST_NOW_MS) {
        return i18n.t("format.justNow");
    }

    const formatter = new Intl.RelativeTimeFormat(locale(), { numeric: "auto" });
    if (elapsed < HOUR_MS) {
        return formatter.format(-Math.round(elapsed / MINUTE_MS), "minute");
    }
    if (elapsed < DAY_MS) {
        return formatter.format(-Math.round(elapsed / HOUR_MS), "hour");
    }
    return formatter.format(-Math.round(elapsed / DAY_MS), "day");
}

export function isSameDay(iso: string, now: number) {
    return new Date(iso).toDateString() === new Date(now).toDateString();
}

export function truncate(text: string, maxLength: number) {
    return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
