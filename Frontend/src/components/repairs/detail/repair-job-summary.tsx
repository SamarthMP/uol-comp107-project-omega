import ViewerAvatars from "@/components/presence/viewer-avatars";
import { Card } from "@/components/ui/card";
import useNow from "@/hooks/use-now";
import { formatDateTime, formatRelative } from "@/lib/repairs/repair-format";
import type { OnlineUser, RepairJob } from "@/lib/repairs/repair-types";
import { IconCalendarEvent, IconClock, IconHome, IconUser } from "@tabler/icons-react";
import type { Ref } from "react";
import { useTranslation } from "react-i18next";
import PriorityBadge from "../badges/priority-badge";
import StatusBadge from "../badges/status-badge";
import RepairLatestNote from "./repair-latest-note";
import RepairMetaItem from "./repair-meta-item";
import RepairStatusStepper from "./repair-status-stepper";

interface RepairJobSummaryProps {
    job: RepairJob;
    headingId: string;
    headingRef: Ref<HTMLHeadingElement>;
    viewers: OnlineUser[];
}

// The current state of a job at a glance: reference, priority, status, what was reported and by whom
export default function RepairJobSummary({ job, headingId, headingRef, viewers }: RepairJobSummaryProps) {
    const { t } = useTranslation();
    const now = useNow();

    return (
        <Card className="gap-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
                <PriorityBadge priority={job.priority} />
                <StatusBadge status={job.status} />
                <ViewerAvatars users={viewers} className="ml-auto" />
            </div>

            <div>
                <h2
                    id={headingId}
                    ref={headingRef}
                    tabIndex={-1}
                    className="font-mono text-sm font-semibold tracking-wide text-muted-foreground outline-none focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring"
                >
                    {t("repairs.detail.heading", { reference: job.reference })}
                </h2>
                <p className="mt-1.5 text-xl leading-snug font-semibold whitespace-pre-wrap wrap-anywhere sm:text-2xl">
                    {job.description}
                </p>
            </div>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                <RepairMetaItem icon={IconHome} label={t("repairs.detail.house")}>
                    {job.houseName}
                </RepairMetaItem>
                <RepairMetaItem icon={IconUser} label={t("repairs.detail.reportedBy")}>
                    {job.reporterName}
                </RepairMetaItem>
                <RepairMetaItem icon={IconCalendarEvent} label={t("repairs.detail.reportedOn")}>
                    <time dateTime={job.createdAt}>{formatDateTime(job.createdAt)}</time>
                </RepairMetaItem>
                <RepairMetaItem icon={IconClock} label={t("repairs.detail.lastUpdated")}>
                    <time dateTime={job.updatedAt}>{formatRelative(job.updatedAt, now)}</time>
                </RepairMetaItem>
            </dl>

            <RepairStatusStepper job={job} />

            {job.status !== "Completed" && <RepairLatestNote job={job} />}
        </Card>
    );
}
