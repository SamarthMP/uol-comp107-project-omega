import { Button } from "@/components/ui/button";
import StatusMessage from "@/components/ui/status-message";
import { useAuth } from "@/hooks/use-auth";
import { useRealtime } from "@/hooks/use-realtime";
import { jobHeadingId } from "@/lib/repairs/repair-dom";
import type { RepairJob } from "@/lib/repairs/repair-types";
import routes from "@/lib/routes";
import useStatusTracker, { type StatusTracker } from "@/lib/use-status.tracker";
import { IconArrowLeft } from "@tabler/icons-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import RepairCompletionCallout from "./repair-completion-callout";
import RepairHistoryTimeline from "./repair-history-timeline";
import RepairJobActions from "./repair-job-actions";
import RepairJobSummary from "./repair-job-summary";

interface RepairJobDetailProps {
    job: RepairJob;
    // Confirmation shown after this job was just reported. Focus is then moved here by the closing report dialog.
    createdStatus?: StatusTracker;
}

// Full view of one job. Rendered with a key per job, so each job starts with fresh form state.
export default function RepairJobDetail({ job, createdStatus }: RepairJobDetailProps) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { onlineUsers, viewJob } = useRealtime();
    const headingId = jobHeadingId(job.id);
    const headingRef = useRef<HTMLHeadingElement>(null);
    const completeStatus = useStatusTracker();
    const [justCompleted, setJustCompleted] = useState(false);

    const focusOnMount = useRef(!createdStatus);
    const clearCreatedStatus = useEffectEvent(() => createdStatus?.clear());

    // Move focus to the job so keyboard and screen reader users land on the result they opened.
    // The "reported" confirmation only applies to this visit, so it is cleared on leaving.
    useEffect(() => {
        if (focusOnMount.current) headingRef.current?.focus();
        return () => clearCreatedStatus();
    }, []);

    useEffect(() => {
        viewJob(job.id);
        return () => viewJob(null);
    }, [job.id, viewJob]);

    const viewers = onlineUsers.filter((person) => person.userId !== user?.id && person.viewingJobIds.includes(job.id));

    function handleCompleted(updated: RepairJob) {
        completeStatus.setStatus("success", t("repairs.complete.saved", { reference: updated.reference }));
        setJustCompleted(true);
    }

    return (
        <article aria-labelledby={headingId} className="flex flex-col gap-4 sm:gap-5">
            <Button asChild variant="ghost" className="-ml-2 self-start lg:hidden">
                <Link to={routes.MAIN}>
                    <IconArrowLeft />
                    {t("repairs.detail.back")}
                </Link>
            </Button>

            {createdStatus && <StatusMessage {...createdStatus} />}

            <RepairJobSummary job={job} headingId={headingId} headingRef={headingRef} viewers={viewers} />

            {job.status === "Completed" ? (
                <RepairCompletionCallout job={job} status={completeStatus} autoFocus={justCompleted} />
            ) : (
                <RepairJobActions job={job} onCompleted={handleCompleted} />
            )}

            <RepairHistoryTimeline job={job} />
        </article>
    );
}
