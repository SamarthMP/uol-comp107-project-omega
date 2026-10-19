import { createRepairsConnection, HUB_EVENTS, HUB_METHODS } from "@/lib/repairs/repairs-hub";
import type { OnlineUser, RealtimeState } from "@/lib/repairs/repair-types";
import { HubConnectionState, type HubConnection } from "@microsoft/signalr";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

const START_RETRY_DELAY_MS = 5_000;

interface RealtimeContextValue {
    connection: HubConnection | null;
    state: RealtimeState;
    onlineUsers: OnlineUser[];
    // Increments every time the connection is (re)established, so data can be re-synced
    connectionEpoch: number;
    viewJob: (jobId: number | null) => void;
    refreshProfile: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [state, setState] = useState<RealtimeState>("connecting");
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [connectionEpoch, setConnectionEpoch] = useState(0);
    const viewingJobRef = useRef<number | null>(null);
    const connectionRef = useRef<HubConnection | null>(null);

    useEffect(() => {
        const hub = createRepairsConnection();
        connectionRef.current = hub;
        let disposed = false;
        let retryTimer: number | undefined;

        function markConnected() {
            setState("connected");
            setConnectionEpoch((epoch) => epoch + 1);
            void hub.invoke(HUB_METHODS.viewJob, viewingJobRef.current).catch(() => undefined);
        }

        function scheduleStart() {
            window.clearTimeout(retryTimer);
            retryTimer = window.setTimeout(() => void start(), START_RETRY_DELAY_MS);
        }

        async function start() {
            try {
                await hub.start();
                if (disposed) return;
                setConnection(hub);
                markConnected();
            } catch {
                if (disposed) return;
                setState("disconnected");
                scheduleStart();
            }
        }

        hub.on(HUB_EVENTS.presenceChanged, (users: OnlineUser[]) => setOnlineUsers(users));
        hub.onreconnecting(() => setState("reconnecting"));
        hub.onreconnected(() => markConnected());
        hub.onclose(() => {
            if (disposed) return;
            setState("disconnected");
            setOnlineUsers([]);
            scheduleStart();
        });

        void start();

        return () => {
            disposed = true;
            window.clearTimeout(retryTimer);
            connectionRef.current = null;
            void hub.stop();
        };
    }, []);

    const viewJob = useCallback((jobId: number | null) => {
        viewingJobRef.current = jobId;
        const hub = connectionRef.current;
        if (hub?.state === HubConnectionState.Connected) {
            void hub.invoke(HUB_METHODS.viewJob, jobId).catch(() => undefined);
        }
    }, []);

    const refreshProfile = useCallback(() => {
        const hub = connectionRef.current;
        if (hub?.state === HubConnectionState.Connected) {
            void hub.invoke(HUB_METHODS.refreshProfile).catch(() => undefined);
        }
    }, []);

    const value = useMemo(
        () => ({ connection, state, onlineUsers, connectionEpoch, viewJob, refreshProfile }),
        [connection, state, onlineUsers, connectionEpoch, viewJob, refreshProfile]
    );

    return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
    const ctx = useContext(RealtimeContext);
    if (!ctx) throw new Error("useRealtime must be used within RealtimeProvider");
    return ctx;
}
