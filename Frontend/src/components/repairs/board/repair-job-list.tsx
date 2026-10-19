import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import useNow from "@/hooks/use-now";
import { useRealtime } from "@/hooks/use-realtime";
import { useRepairs } from "@/hooks/use-repairs";
import type { RepairFilters, RepairJob } from "@/lib/repairs/repair-types";
import { useTranslation } from "react-i18next";
import RepairEmptyState from "./repair-empty-state";
import RepairJobCard from "./repair-job-card";
import RepairLoadError from "./repair-load-error";
import RepairListSkeleton from "./repair-list-skeleton";
import RepairListToolbar from "./repair-list-toolbar";

interface RepairJobListProps {
    visibleJobs: RepairJob[];
    filters: RepairFilters;
    filtersActive: boolean;
    selectedId: number | null;
    onFiltersChange: (filters: RepairFilters) => void;
    onClearFilters: () => void;
    onReport: () => void;
}

export default function RepairJobList({ visibleJobs, filters, filtersActive, selectedId, onFiltersChange, onClearFilters, onReport }: RepairJobListProps) {
    const { t } = useTranslation();
    const now = useNow();
    const { user } = useAuth();
    const { onlineUsers } = useRealtime();
    const { jobs, loading, error, recentRemoteChanges } = useRepairs();

    const viewersOf = (jobId: number) =>
        onlineUsers.filter((person) => person.userId !== user?.id && person.viewingJobIds.includes(jobId));

    function renderContent() {
        if (loading && jobs.length === 0) {
            return <RepairListSkeleton />;
        }

        if (error && jobs.length === 0) {
            return <RepairLoadError message={error} />;
        }

        if (visibleJobs.length === 0) {
            return <RepairEmptyState filtered={jobs.length > 0} onReport={onReport} onClearFilters={onClearFilters} />;
        }

        return (
            <ul className="flex flex-col gap-2.5" aria-label={t("repairs.list.label")}>
                {visibleJobs.map((job) => (
                    <li key={job.id} className="sp-rise-in">
                        <RepairJobCard
                            job={job}
                            now={now}
                            selected={job.id === selectedId}
                            viewers={viewersOf(job.id)}
                            remoteChangeAt={recentRemoteChanges[job.id]}
                        />
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <RepairListToolbar filters={filters} onChange={onFiltersChange} />

            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                <p aria-live="polite">
                    {filtersActive
                        ? t("repairs.list.showingFiltered", { count: visibleJobs.length, total: jobs.length })
                        : t("repairs.list.showingAll", { count: jobs.length })}
                </p>
                {filtersActive && (
                    <Button variant="link" className="h-auto p-0" onClick={onClearFilters}>
                        {t("repairs.actions.clearFilters")}
                    </Button>
                )}
            </div>

            {renderContent()}
        </div>
    );
}
