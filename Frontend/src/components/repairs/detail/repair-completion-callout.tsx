import { Card } from "@/components/ui/card";
import StatusMessage from "@/components/ui/status-message";
import { formatDateTime } from "@/lib/repairs/repair-format";
import type { RepairJob } from "@/lib/repairs/repair-types";
import type { StatusTracker } from "@/lib/use-status.tracker";
import { IconCircleCheckFilled } from "@tabler/icons-react";
import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";

interface RepairCompletionCalloutProps {
    job: RepairJob;
    status?: StatusTracker;
    autoFocus?: boolean;
}

// Shows that a job is finished, when and by whom, and the note explaining what was done
export default function RepairCompletionCallout({ job, status, autoFocus }: RepairCompletionCalloutProps) {
    const { t } = useTranslation();
    const headingId = useId();
    const headingRef = useRef<HTMLHeadingElement>(null);
    const completedEntry = job.history.find((entry) => entry.type === "Completed");

    useEffect(() => {
        if (autoFocus) headingRef.current?.focus();
    }, [autoFocus]);

    return (
        <Card role="region" aria-labelledby={headingId} className="gap-4 border-success p-5 sm:p-6 sp-rise-in">
            {status && <StatusMessage {...status} />}

            <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-card" aria-hidden>
                    <IconCircleCheckFilled className="size-6" />
                </span>
                <div className="min-w-0">
                    <h3 id={headingId} ref={headingRef} tabIndex={-1} className="text-lg font-semibold text-success outline-none">
                        {t("repairs.completed.title")}
                    </h3>
                    {job.completedAt && (
                        <p className="text-sm text-muted-foreground wrap-anywhere">
                            {t("repairs.completed.meta", {
                                date: formatDateTime(job.completedAt),
                                name: completedEntry?.actorName ?? "",
                            })}
                        </p>
                    )}
                </div>
            </div>

            <div className="rounded-lg border p-4">
                <p className="text-sm font-semibold text-muted-foreground">{t("repairs.completed.noteLabel")}</p>
                <p className="mt-1 text-base whitespace-pre-wrap wrap-anywhere">{job.completionNote}</p>
            </div>
        </Card>
    );
}
