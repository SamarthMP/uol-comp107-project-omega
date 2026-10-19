import { formatDateTime } from "@/lib/repairs/repair-format";
import type { RepairJob } from "@/lib/repairs/repair-types";
import { IconNotes } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

export default function RepairLatestNote({ job }: { job: RepairJob }) {
    const { t } = useTranslation();

    if (!job.latestNote) return null;

    return (
        <div key={job.latestNoteAt} className="flex gap-3 rounded-xl bg-accent p-4 text-accent-foreground sp-rise-in">
            <IconNotes className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
                <p className="text-sm font-semibold">
                    {t("repairs.latestNote.title")}
                    {job.latestNoteAt && (
                        <span className="font-normal text-muted-foreground">
                            {" · "}
                            <time dateTime={job.latestNoteAt}>{formatDateTime(job.latestNoteAt)}</time>
                        </span>
                    )}
                </p>
                <p className="mt-1 whitespace-pre-wrap wrap-anywhere">{job.latestNote}</p>
            </div>
        </div>
    );
}
