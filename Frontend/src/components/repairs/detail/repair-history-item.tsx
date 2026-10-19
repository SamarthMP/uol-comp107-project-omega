import { formatDateTime, formatFullDateTime } from "@/lib/repairs/repair-format";
import type { RepairHistoryEntry, RepairStatus } from "@/lib/repairs/repair-types";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import StatusBadge from "../badges/status-badge";

const DOT_TONES: Record<RepairStatus, string> = {
    New: "bg-info",
    InProgress: "bg-warning",
    Completed: "bg-success",
};

interface RepairHistoryItemProps {
    entry: RepairHistoryEntry;
    reporterName: string;
    isLatest: boolean;
}

// One point on the history timeline: when it happened, the resulting status, who did it and any note
export default function RepairHistoryItem({ entry, reporterName, isLatest }: RepairHistoryItemProps) {
    const { t } = useTranslation();
    const isReport = entry.type === "Reported";
    const loggedBySomeoneElse = isReport && entry.actorName !== reporterName;

    return (
        <li className="relative pb-7 pl-6 last:pb-1 sp-rise-in">
            <span aria-hidden className={cn("absolute top-[3px] -left-2 size-3.5 rounded-full", DOT_TONES[entry.status])} />

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <time dateTime={entry.createdAt} title={formatFullDateTime(entry.createdAt)} className="text-sm text-muted-foreground tabular-nums">
                    {formatDateTime(entry.createdAt)}
                </time>
                {isLatest && (
                    <span className="rounded-full border border-primary px-2 text-sm font-semibold text-primary">
                        {t("repairs.history.latest")}
                    </span>
                )}
            </div>

            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-medium wrap-anywhere">
                <StatusBadge status={entry.status} />
                <span>{t(`repairs.history.events.${entry.type}`, { name: isReport ? reporterName : entry.actorName })}</span>
            </p>

            {loggedBySomeoneElse && (
                <p className="mt-1 text-sm text-muted-foreground wrap-anywhere">{t("repairs.history.loggedBy", { name: entry.actorName })}</p>
            )}

            {entry.note && (
                <p className="mt-2 rounded-lg border px-3 py-2 whitespace-pre-wrap wrap-anywhere">{entry.note}</p>
            )}
        </li>
    );
}
