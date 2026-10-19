export type RepairPriority = "Normal" | "Urgent";

export type RepairStatus = "New" | "InProgress" | "Completed";

export type RepairHistoryEntryType = "Reported" | "WorkStarted" | "ProgressNote" | "Completed";

export interface RepairHistoryEntry {
    id: number;
    type: RepairHistoryEntryType;
    status: RepairStatus;
    note: string | null;
    actorName: string;
    createdAt: string;
}

export interface RepairJob {
    id: number;
    reference: string;
    houseName: string;
    description: string;
    reporterName: string;
    priority: RepairPriority;
    status: RepairStatus;
    latestNote: string | null;
    latestNoteAt: string | null;
    completionNote: string | null;
    createdAt: string;
    updatedAt: string;
    startedAt: string | null;
    completedAt: string | null;
    version: number;
    // Newest first
    history: RepairHistoryEntry[];
}

export interface CreateRepairJobInput {
    description: string;
    reporterName: string;
    priority: RepairPriority;
}

export interface RepairJobChangedEvent {
    kind: RepairHistoryEntryType;
    job: RepairJob;
    actorUserId: string;
    actorName: string;
}

export interface OnlineUser {
    userId: string;
    displayName: string;
    profilePictureUrl: string | null;
    viewingJobIds: number[];
}

export type RealtimeState = "connecting" | "connected" | "reconnecting" | "disconnected";

export type StatusFilter = "All" | RepairStatus;

export type RepairSortOrder = "newest" | "oldest" | "urgent" | "updated";

export interface RepairFilters {
    query: string;
    status: StatusFilter;
    urgentOnly: boolean;
    sort: RepairSortOrder;
}

// Mirrors the server-side limits in Backend/Repairs/Models/RepairLimits.cs
export const REPAIR_LIMITS = {
    description: 1000,
    reporterName: 100,
    note: 1000,
} as const;
