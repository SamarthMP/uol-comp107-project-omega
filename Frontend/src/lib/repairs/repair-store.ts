import type { RepairJob } from "./repair-types";

function byNewest(a: RepairJob, b: RepairJob) {
    return b.id - a.id;
}

// Inserts or replaces a job, ignoring stale copies so out-of-order realtime events can't roll a job back
export function upsertJob(jobs: RepairJob[], incoming: RepairJob) {
    const index = jobs.findIndex((job) => job.id === incoming.id);
    if (index === -1) {
        return [incoming, ...jobs].sort(byNewest);
    }

    if (jobs[index].version > incoming.version) {
        return jobs;
    }

    const next = [...jobs];
    next[index] = incoming;
    return next;
}

// Merges a freshly fetched list into the current one, keeping the newest version of each job
export function mergeJobs(current: RepairJob[], fetched: RepairJob[]) {
    const merged = new Map(current.map((job) => [job.id, job]));

    for (const job of fetched) {
        const existing = merged.get(job.id);
        if (!existing || existing.version <= job.version) {
            merged.set(job.id, job);
        }
    }

    return [...merged.values()].sort(byNewest);
}
