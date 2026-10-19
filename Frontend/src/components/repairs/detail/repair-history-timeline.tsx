import { Card } from "@/components/ui/card";
import type { RepairJob } from "@/lib/repairs/repair-types";
import { IconHistory } from "@tabler/icons-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import RepairHistoryItem from "./repair-history-item";

// Every dated event for a job, newest first. Entries are append-only, so nothing earlier is ever lost.
export default function RepairHistoryTimeline({ job }: { job: RepairJob }) {
    const { t } = useTranslation();
    const headingId = useId();

    return (
        <Card role="region" aria-labelledby={headingId} className="gap-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h3 id={headingId} className="flex items-center gap-2 text-lg font-semibold">
                        <IconHistory className="size-5 text-primary" aria-hidden />
                        {t("repairs.history.title")}
                    </h3>
                    <p className="text-sm text-muted-foreground">{t("repairs.history.order")}</p>
                </div>
                <span className="text-sm text-muted-foreground">
                    {t("repairs.history.count", { count: job.history.length })}
                </span>
            </div>

            <ol className="flex flex-col">
                {job.history.map((entry, index) => (
                    <RepairHistoryItem
                        key={entry.id}
                        entry={entry}
                        reporterName={job.reporterName}
                        isLatest={index === 0 && job.history.length > 1}
                        isLast={index === job.history.length - 1}
                    />
                ))}
            </ol>
        </Card>
    );
}
