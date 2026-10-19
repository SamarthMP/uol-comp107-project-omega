import AppPage from "@/components/app-page";
import RepairBoardHeader from "@/components/repairs/board/repair-board-header";
import RepairLoadError from "@/components/repairs/board/repair-load-error";
import RepairJobList from "@/components/repairs/board/repair-job-list";
import RepairStatusFilters from "@/components/repairs/board/repair-status-filters";
import RepairDetailPlaceholder from "@/components/repairs/detail/repair-detail-placeholder";
import RepairJobDetail from "@/components/repairs/detail/repair-job-detail";
import ReportRepairDialog from "@/components/repairs/forms/report-repair-dialog";
import useDocumentTitle from "@/hooks/use-document-title";
import { useRepairs } from "@/hooks/use-repairs";
import { applyRepairFilters, countRepairs, DEFAULT_REPAIR_FILTERS, hasActiveFilters } from "@/lib/repairs/repair-filters";
import { focusElementById, jobCardId } from "@/lib/repairs/repair-dom";
import type { RepairFilters, RepairJob } from "@/lib/repairs/repair-types";
import { jobRoute } from "@/lib/routes";
import useStatusTracker from "@/lib/use-status.tracker";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

const MAX_REPORTER_SUGGESTIONS = 50;
const TWO_PANE_QUERY = "(min-width: 1024px)";

// The repairs board: status overview, searchable job list and the selected job's details.
// On small screens the list and details are shown one at a time.
export default function RepairsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { jobId } = useParams();
    const { jobs, loading, error } = useRepairs();

    const [filters, setFilters] = useState<RepairFilters>(DEFAULT_REPAIR_FILTERS);
    const [reportOpen, setReportOpen] = useState(false);
    const [createdJobId, setCreatedJobId] = useState<number | null>(null);
    const createdStatus = useStatusTracker();
    const pageRef = useRef<HTMLDivElement>(null);
    const detailPaneRef = useRef<HTMLElement>(null);
    const lastOpenedIdRef = useRef<number | null>(null);

    const hasSelection = jobId !== undefined;
    const selectedId = hasSelection && /^\d+$/.test(jobId) ? Number(jobId) : null;
    const selectedJob = selectedId === null ? undefined : jobs.find((job) => job.id === selectedId);

    const counts = useMemo(() => countRepairs(jobs), [jobs]);
    const visibleJobs = useMemo(() => applyRepairFilters(jobs, filters), [jobs, filters]);
    const reporterSuggestions = useMemo(
        () => [...new Set(jobs.map((job) => job.reporterName))].sort((a, b) => a.localeCompare(b)).slice(0, MAX_REPORTER_SUGGESTIONS),
        [jobs]
    );

    useDocumentTitle(selectedJob ? t("repairs.pageTitle.job", { reference: selectedJob.reference }) : t("repairs.pageTitle.board"));

    // Each opened job starts scrolled to the top. On phones, going back to the list
    // returns focus to the job that was open so keyboard users keep their place.
    useEffect(() => {
        const twoPane = window.matchMedia(TWO_PANE_QUERY).matches;

        if (hasSelection) {
            detailPaneRef.current?.scrollTo({ top: 0 });
            if (!twoPane) pageRef.current?.scrollTo({ top: 0 });
            lastOpenedIdRef.current = selectedId;
            return;
        }

        if (!twoPane && lastOpenedIdRef.current !== null) {
            focusElementById(jobCardId(lastOpenedIdRef.current));
        }
    }, [hasSelection, selectedId]);

    function handleCreated(job: RepairJob) {
        setReportOpen(false);
        // Make sure the new job is visible in the list, even if the current filters would hide it
        if (applyRepairFilters([job], filters).length === 0) {
            setFilters(DEFAULT_REPAIR_FILTERS);
        }
        setCreatedJobId(job.id);
        createdStatus.setStatus("success", t("repairs.report.created", { reference: job.reference }));
        navigate(jobRoute(job.id));
    }

    return (
        <AppPage ref={pageRef} className="gap-6 lg:overflow-hidden">
            <div className={cn("flex flex-col gap-6", hasSelection && "hidden lg:flex")}>
                <RepairBoardHeader onReport={() => setReportOpen(true)} />
                <RepairStatusFilters
                    jobs={jobs}
                    counts={counts}
                    selected={filters.status}
                    onSelect={(status) => setFilters((current) => ({ ...current, status }))}
                />
            </div>

            <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(17rem,21rem)_minmax(0,1fr)] lg:grid-rows-1 xl:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)]">
                <section
                    aria-label={t("repairs.list.sectionLabel")}
                    className={cn("min-w-0 lg:-m-1 lg:min-h-0 lg:overflow-y-auto lg:p-1 lg:pb-4", hasSelection && "hidden lg:block")}
                >
                    <RepairJobList
                        visibleJobs={visibleJobs}
                        filters={filters}
                        filtersActive={hasActiveFilters(filters)}
                        selectedId={selectedId}
                        onFiltersChange={setFilters}
                        onClearFilters={() => setFilters(DEFAULT_REPAIR_FILTERS)}
                        onReport={() => setReportOpen(true)}
                    />
                </section>

                <section
                    ref={detailPaneRef}
                    aria-label={t("repairs.detail.sectionLabel")}
                    className={cn("min-w-0 lg:-m-1 lg:min-h-0 lg:overflow-y-auto lg:p-1 lg:pb-4", !hasSelection && "hidden lg:block")}
                >
                    {selectedJob ? (
                        <RepairJobDetail
                            key={selectedJob.id}
                            job={selectedJob}
                            createdStatus={createdJobId === selectedJob.id ? createdStatus : undefined}
                        />
                    ) : hasSelection && error && jobs.length === 0 ? (
                        <RepairLoadError message={error} />
                    ) : (
                        <RepairDetailPlaceholder notFound={hasSelection && !loading} />
                    )}
                </section>
            </div>

            <ReportRepairDialog
                open={reportOpen}
                onOpenChange={setReportOpen}
                reporterSuggestions={reporterSuggestions}
                onCreated={handleCreated}
            />
        </AppPage>
    );
}
