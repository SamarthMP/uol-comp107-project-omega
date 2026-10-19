import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import StatusMessage from "@/components/ui/status-message";
import type { RepairJob } from "@/lib/repairs/repair-types";
import useStatusTracker from "@/lib/use-status.tracker";
import { useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import RepairCompleteForm from "../forms/repair-complete-form";
import RepairNoteForm from "../forms/repair-note-form";
import RepairStartWork from "./repair-start-work";

interface RepairJobActionsProps {
    job: RepairJob;
    onCompleted: (job: RepairJob) => void;
}

// Everything needed to progress an open job: start work, add notes, and complete it
export default function RepairJobActions({ job, onCompleted }: RepairJobActionsProps) {
    const { t } = useTranslation();
    const headingId = useId();
    const headingRef = useRef<HTMLHeadingElement>(null);
    const startStatus = useStatusTracker();

    return (
        <Card role="region" aria-labelledby={headingId} className="gap-5 p-5 sm:p-6">
            <div>
                <h3 id={headingId} ref={headingRef} tabIndex={-1} className="text-lg font-semibold outline-none">
                    {t("repairs.update.title")}
                </h3>
                <p className="text-sm text-muted-foreground">{t("repairs.update.description")}</p>
            </div>

            {job.status === "New" ? (
                <RepairStartWork job={job} status={startStatus} onStarted={() => headingRef.current?.focus()} />
            ) : (
                <StatusMessage {...startStatus} />
            )}

            <Separator />

            <div className="grid gap-6 xl:grid-cols-2 xl:gap-0">
                <div className="xl:pr-6">
                    <RepairNoteForm job={job} />
                </div>
                <div className="border-t pt-6 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-6">
                    <RepairCompleteForm job={job} onCompleted={onCompleted} />
                </div>
            </div>
        </Card>
    );
}
