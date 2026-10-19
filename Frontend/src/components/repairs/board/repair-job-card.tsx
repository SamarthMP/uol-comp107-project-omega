import ViewerAvatars from "@/components/presence/viewer-avatars";
import { formatFullDateTime, formatRelative } from "@/lib/repairs/repair-format";
import type { OnlineUser, RepairJob } from "@/lib/repairs/repair-types";
import { jobCardId } from "@/lib/repairs/repair-dom";
import { jobRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { IconMessage2, IconUser } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import PriorityBadge from "../badges/priority-badge";
import StatusBadge from "../badges/status-badge";

interface RepairJobCardProps {
    job: RepairJob;
    selected: boolean;
    now: number;
    viewers: OnlineUser[];
    // Set briefly after someone else changes this job, to replay a highlight
    remoteChangeAt?: number;
}

export default function RepairJobCard({ job, selected, now, viewers, remoteChangeAt }: RepairJobCardProps) {
    const { t } = useTranslation();
    const noteCount = job.history.filter((entry) => entry.type === "ProgressNote").length;

    return (
        <Link
            id={jobCardId(job.id)}
            to={jobRoute(job.id)}
            aria-current={selected ? "page" : undefined}
            className={cn(
                "group relative block rounded-xl border bg-card p-4 shadow-xs transition-all duration-200 outline-none",
                "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring",
                selected && "border-primary bg-accent ring-1 ring-primary hover:border-primary",
                job.priority === "Urgent" && job.status !== "Completed" && "border-l-4 border-l-destructive"
            )}
        >
            {remoteChangeAt && <span key={remoteChangeAt} aria-hidden className="pointer-events-none absolute inset-0 rounded-xl sp-flash" />}

            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm font-semibold text-muted-foreground">{job.reference}</span>
                <span className="flex flex-wrap items-center gap-1.5">
                    {job.priority === "Urgent" && <PriorityBadge priority={job.priority} />}
                    <StatusBadge status={job.status} />
                </span>
            </div>

            <p className="mt-2 font-semibold whitespace-pre-line wrap-anywhere lg:line-clamp-4">{job.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
                <span className="flex min-w-0 items-center gap-1">
                    <IconUser className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{job.reporterName}</span>
                </span>
                <time dateTime={job.createdAt} title={formatFullDateTime(job.createdAt)}>
                    {formatRelative(job.createdAt, now)}
                </time>
                {noteCount > 0 && (
                    <span className="flex items-center gap-1">
                        <IconMessage2 className="size-4" aria-hidden />
                        {t("repairs.list.noteCount", { count: noteCount })}
                    </span>
                )}
                <ViewerAvatars users={viewers} size="sm" className="ml-auto" />
            </div>
        </Link>
    );
}
