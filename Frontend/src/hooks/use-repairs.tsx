import { useAuth } from "@/hooks/use-auth";
import { useRealtime } from "@/hooks/use-realtime";
import type { ErrorResponse } from "@/lib/auth-types";
import { getBackendErrorMessage } from "@/lib/backend-error";
import { addRepairNote, completeRepairJob, createRepairJob, listRepairJobs, startRepairWork } from "@/lib/repairs/repair-client";
import { truncate } from "@/lib/repairs/repair-format";
import { mergeJobs, upsertJob } from "@/lib/repairs/repair-store";
import type { CreateRepairJobInput, RepairJob, RepairJobChangedEvent } from "@/lib/repairs/repair-types";
import { HUB_EVENTS } from "@/lib/repairs/repairs-hub";
import { jobRoute } from "@/lib/routes";
import { createContext, useCallback, useContext, useEffect, useEffectEvent, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const REMOTE_HIGHLIGHT_MS = 2_500;
const TOAST_DESCRIPTION_LENGTH = 120;

interface RepairsContextValue {
    jobs: RepairJob[];
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
    createJob: (input: CreateRepairJobInput) => Promise<RepairJob>;
    startWork: (jobId: number) => Promise<RepairJob>;
    addNote: (jobId: number, note: string) => Promise<RepairJob>;
    completeJob: (jobId: number, completionNote: string) => Promise<RepairJob>;
    // Jobs recently changed by someone else, mapped to when it happened (used to highlight them)
    recentRemoteChanges: Record<number, number>;
}

const RepairsContext = createContext<RepairsContextValue | null>(null);

// Holds every repair job for the house. Local actions update the list from the API response straight away,
// and changes made by other people arrive over the realtime connection.
export function RepairsProvider({ children }: { children: ReactNode }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { connection, connectionEpoch } = useRealtime();

    const [jobs, setJobs] = useState<RepairJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recentRemoteChanges, setRecentRemoteChanges] = useState<Record<number, number>>({});
    const highlightTimers = useRef(new Map<number, number>());

    const reload = useCallback(async () => {
        try {
            const latest = await listRepairJobs();
            setJobs((current) => mergeJobs(current, latest));
            setError(null);
        } catch (err: unknown) {
            setError(getBackendErrorMessage(err as ErrorResponse, t("repairs.list.loadFailed")));
        } finally {
            setLoading(false);
        }
    }, [t]);

    // Load on mount, then re-sync after every reconnect in case changes were missed while offline
    useEffect(() => {
        void reload();
    }, [reload, connectionEpoch]);

    function highlightRemoteChange(jobId: number) {
        const changedAt = Date.now();
        setRecentRemoteChanges((current) => ({ ...current, [jobId]: changedAt }));

        window.clearTimeout(highlightTimers.current.get(jobId));
        highlightTimers.current.set(jobId, window.setTimeout(() => {
            highlightTimers.current.delete(jobId);
            setRecentRemoteChanges((current) => {
                const next = { ...current };
                delete next[jobId];
                return next;
            });
        }, REMOTE_HIGHLIGHT_MS));
    }

    function announceRemoteChange(change: RepairJobChangedEvent) {
        const { job } = change;
        const isUrgentReport = change.kind === "Reported" && job.priority === "Urgent";
        const messageKey = isUrgentReport ? "repairs.realtime.ReportedUrgent" : `repairs.realtime.${change.kind}`;
        const show = isUrgentReport ? toast.warning : change.kind === "Completed" ? toast.success : toast.info;

        show(t(messageKey, { name: change.actorName, reference: job.reference }), {
            description: truncate(job.description, TOAST_DESCRIPTION_LENGTH),
            action: {
                label: t("repairs.realtime.view"),
                onClick: () => navigate(jobRoute(job.id)),
            },
        });
    }

    const onJobChanged = useEffectEvent((change: RepairJobChangedEvent) => {
        setJobs((current) => upsertJob(current, change.job));

        if (change.actorUserId === user?.id) return;

        highlightRemoteChange(change.job.id);
        announceRemoteChange(change);
    });

    useEffect(() => {
        if (!connection) return;

        const handler = (change: RepairJobChangedEvent) => onJobChanged(change);
        connection.on(HUB_EVENTS.jobChanged, handler);
        return () => connection.off(HUB_EVENTS.jobChanged, handler);
    }, [connection]);

    useEffect(() => {
        const timers = highlightTimers.current;
        return () => timers.forEach((timer) => window.clearTimeout(timer));
    }, []);

    const applyJob = useCallback((job: RepairJob) => {
        setJobs((current) => upsertJob(current, job));
        return job;
    }, []);

    const createJob = useCallback(async (input: CreateRepairJobInput) => applyJob(await createRepairJob(input)), [applyJob]);
    const startWork = useCallback(async (jobId: number) => applyJob(await startRepairWork(jobId)), [applyJob]);
    const addNote = useCallback(async (jobId: number, note: string) => applyJob(await addRepairNote(jobId, note)), [applyJob]);
    const completeJob = useCallback(async (jobId: number, completionNote: string) => applyJob(await completeRepairJob(jobId, completionNote)), [applyJob]);

    const value = useMemo(
        () => ({ jobs, loading, error, reload, createJob, startWork, addNote, completeJob, recentRemoteChanges }),
        [jobs, loading, error, reload, createJob, startWork, addNote, completeJob, recentRemoteChanges]
    );

    return <RepairsContext.Provider value={value}>{children}</RepairsContext.Provider>;
}

export function useRepairs() {
    const ctx = useContext(RepairsContext);
    if (!ctx) throw new Error("useRepairs must be used within RepairsProvider");
    return ctx;
}
