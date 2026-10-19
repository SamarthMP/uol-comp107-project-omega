import type { RepairFilters, RepairJob, RepairStatus, StatusFilter } from "./repair-types";

export const DEFAULT_REPAIR_FILTERS: RepairFilters = {
    query: "",
    status: "All",
    urgentOnly: false,
    sort: "newest",
};

export interface RepairCounts {
    total: Record<StatusFilter, number>;
    urgent: Record<StatusFilter, number>;
    open: number;
}

function matchesQuery(job: RepairJob, query: string) {
    if (!query) return true;

    const haystack = [job.reference, job.description, job.reporterName, job.latestNote, job.completionNote]
        .filter(Boolean)
        .join("\n")
        .toLocaleLowerCase();

    return query
        .toLocaleLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .every((term) => haystack.includes(term));
}

const STATUS_ORDER: Record<RepairStatus, number> = { New: 0, InProgress: 1, Completed: 2 };

function compareJobs(sort: RepairFilters["sort"]) {
    return (a: RepairJob, b: RepairJob) => {
        switch (sort) {
            case "oldest":
                return a.id - b.id;
            case "updated":
                return b.updatedAt.localeCompare(a.updatedAt) || b.id - a.id;
            case "urgent": {
                // Open urgent work first, then open normal work, then completed jobs
                const aRank = (a.status === "Completed" ? 2 : 0) + (a.priority === "Urgent" ? 0 : 1);
                const bRank = (b.status === "Completed" ? 2 : 0) + (b.priority === "Urgent" ? 0 : 1);
                return aRank - bRank || STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.id - a.id;
            }
            case "newest":
            default:
                return b.id - a.id;
        }
    };
}

export function applyRepairFilters(jobs: RepairJob[], filters: RepairFilters) {
    const query = filters.query.trim();

    return jobs
        .filter((job) => filters.status === "All" || job.status === filters.status)
        .filter((job) => !filters.urgentOnly || job.priority === "Urgent")
        .filter((job) => matchesQuery(job, query))
        .sort(compareJobs(filters.sort));
}

export function hasActiveFilters(filters: RepairFilters) {
    return filters.query.trim() !== "" || filters.status !== "All" || filters.urgentOnly;
}

export function countRepairs(jobs: RepairJob[]): RepairCounts {
    const empty = (): Record<StatusFilter, number> => ({ All: 0, New: 0, InProgress: 0, Completed: 0 });
    const total = empty();
    const urgent = empty();

    for (const job of jobs) {
        total.All++;
        total[job.status]++;
        if (job.priority === "Urgent") {
            urgent.All++;
            urgent[job.status]++;
        }
    }

    return { total, urgent, open: total.New + total.InProgress };
}
