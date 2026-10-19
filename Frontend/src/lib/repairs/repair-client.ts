import { request } from "../auth-client";
import type { CreateRepairJobInput, RepairJob } from "./repair-types";

const JOBS_PATH = "/repairs/jobs";

export function listRepairJobs() {
    return request<RepairJob[]>(JOBS_PATH);
}

export function createRepairJob(input: CreateRepairJobInput) {
    return request<RepairJob>(JOBS_PATH, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export function startRepairWork(jobId: number) {
    return request<RepairJob>(`${JOBS_PATH}/${jobId}/start`, { method: "POST" });
}

export function addRepairNote(jobId: number, note: string) {
    return request<RepairJob>(`${JOBS_PATH}/${jobId}/notes`, {
        method: "POST",
        body: JSON.stringify({ note }),
    });
}

export function completeRepairJob(jobId: number, completionNote: string) {
    return request<RepairJob>(`${JOBS_PATH}/${jobId}/complete`, {
        method: "POST",
        body: JSON.stringify({ completionNote }),
    });
}
