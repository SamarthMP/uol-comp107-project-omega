import { formatDateTime } from "@/lib/repairs/repair-format";
import type { RepairJob, RepairStatus } from "@/lib/repairs/repair-types";
import { cn } from "@/lib/utils";
import { IconCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

const STEPS: RepairStatus[] = ["New", "InProgress", "Completed"];

function stepTime(job: RepairJob, step: RepairStatus) {
    switch (step) {
        case "New":
            return job.createdAt;
        case "InProgress":
            return job.startedAt;
        case "Completed":
            return job.completedAt;
    }
}

// New → In progress → Completed, with when each stage was reached
export default function RepairStatusStepper({ job }: { job: RepairJob }) {
    const { t } = useTranslation();
    const currentIndex = STEPS.indexOf(job.status);

    return (
        <ol className="grid grid-cols-3 gap-2 sm:gap-3" aria-label={t("repairs.stepper.label")}>
            {STEPS.map((step, index) => {
                const reached = index <= currentIndex;
                const current = index === currentIndex;
                const time = stepTime(job, step);
                const skipped = reached && !time;

                return (
                    <li key={step} aria-current={current ? "step" : undefined} className="min-w-0">
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                                className={cn(
                                    "h-full rounded-full bg-primary transition-[width] duration-700 ease-sp-lg",
                                    reached ? "w-full" : "w-0"
                                )}
                            />
                        </div>
                        <p className={cn("mt-2 flex items-start gap-1 text-sm leading-tight font-semibold", !reached && "text-muted-foreground")}>
                            {reached && !current && <IconCheck className="hidden size-4 shrink-0 text-primary sm:block" aria-hidden />}
                            <span>{t(`repairs.status.${step}`)}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {time ? (
                                <time dateTime={time}>{formatDateTime(time)}</time>
                            ) : skipped ? (
                                t("repairs.stepper.skipped")
                            ) : (
                                t("repairs.stepper.pending")
                            )}
                        </p>
                    </li>
                );
            })}
        </ol>
    );
}
