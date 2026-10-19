import { formatDateTime, formatFullDateTime } from "@/lib/repairs/repair-format";
import type { RepairHistoryEntry, RepairHistoryEntryType } from "@/lib/repairs/repair-types";
import { cn } from "@/lib/utils";
import { IconCircleCheck, IconClipboardPlus, IconMessage2, IconPlayerPlay, type TablerIcon } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

const ENTRY_STYLES: Record<RepairHistoryEntryType, { icon: TablerIcon; className: string }> = {
    Reported: { icon: IconClipboardPlus, className: "text-info" },
    WorkStarted: { icon: IconPlayerPlay, className: "text-warning" },
    ProgressNote: { icon: IconMessage2, className: "text-primary" },
    Completed: { icon: IconCircleCheck, className: "text-success" },
};

interface RepairHistoryItemProps {
    entry: RepairHistoryEntry;
    reporterName: string;
    isLatest: boolean;
    isLast: boolean;
}

export default function RepairHistoryItem({ entry, reporterName, isLatest, isLast }: RepairHistoryItemProps) {
    const { t } = useTranslation();
    const { icon: Icon, className } = ENTRY_STYLES[entry.type];

    return (
        <li className="relative flex gap-3 pb-6 last:pb-0 sp-rise-in">
            {!isLast && <span aria-hidden className="absolute top-10 bottom-1 left-[1.1875rem] w-px bg-border" />}

            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full border bg-card", className)} aria-hidden>
                <Icon className="size-5" />
            </span>

            <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p className="font-semibold">
                        {t(`repairs.history.types.${entry.type}`)}
                        {isLatest && (
                            <span className="ml-2 rounded-full border border-primary px-2 py-0.5 text-sm font-semibold text-primary">
                                {t("repairs.history.latest")}
                            </span>
                        )}
                    </p>
                    <time dateTime={entry.createdAt} title={formatFullDateTime(entry.createdAt)} className="text-sm text-muted-foreground tabular-nums">
                        {formatDateTime(entry.createdAt)}
                    </time>
                </div>

                <p className="text-sm text-muted-foreground wrap-anywhere">
                    {entry.type === "Reported"
                        ? t("repairs.history.reportedBy", { reporter: reporterName, name: entry.actorName })
                        : t("repairs.history.by", { name: entry.actorName })}
                    {" · "}
                    {t("repairs.history.statusAfter", { status: t(`repairs.status.${entry.status}`) })}
                </p>

                {entry.note && (
                    <p className="mt-2 rounded-lg border px-3 py-2 whitespace-pre-wrap wrap-anywhere">{entry.note}</p>
                )}
            </div>
        </li>
    );
}
