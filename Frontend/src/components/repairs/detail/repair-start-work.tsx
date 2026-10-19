import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import StatusMessage from "@/components/ui/status-message";
import { useRepairs } from "@/hooks/use-repairs";
import type { ErrorResponse } from "@/lib/auth-types";
import { getBackendErrorMessage } from "@/lib/backend-error";
import { formatTime } from "@/lib/repairs/repair-format";
import type { RepairJob } from "@/lib/repairs/repair-types";
import type { StatusTracker } from "@/lib/use-status.tracker";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface RepairStartWorkProps {
    job: RepairJob;
    status: StatusTracker;
    onStarted: () => void;
}

// Moves a New job to In progress
export default function RepairStartWork({ job, status, onStarted }: RepairStartWorkProps) {
    const { t } = useTranslation();
    const { startWork } = useRepairs();

    async function handleStart() {
        if (status.loading) return;
        status.setStatus("loading");
        try {
            const updated = await startWork(job.id);
            status.setStatus("success", t("repairs.start.saved", { time: formatTime(updated.startedAt ?? updated.updatedAt) }));
            onStarted();
        } catch (err: unknown) {
            status.setStatus("error", getBackendErrorMessage(err as ErrorResponse, t("repairs.start.failed")));
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-info/40 bg-info/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="font-semibold">{t("repairs.start.title")}</p>
                    <p className="text-sm text-muted-foreground">{t("repairs.start.description")}</p>
                </div>
                <Button size="lg" onClick={handleStart} aria-disabled={status.loading || undefined} className="w-full sm:w-auto">
                    {status.loading ? <Spinner /> : <IconPlayerPlayFilled />}
                    {t("repairs.actions.startWork")}
                </Button>
            </div>
            {status.status === "error" && <StatusMessage {...status} />}
        </div>
    );
}
