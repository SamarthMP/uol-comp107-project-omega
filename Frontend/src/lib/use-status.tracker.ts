import { useCallback, useState } from "react";
import { translateBackendMessage } from "./backend-error";

export type StatusType = "unknown" | "loading" | "success" | "error";

// Simple hook to track the status of an operation.
export default function useStatusTracker(initialStatus: StatusType = "unknown", initialMessage = "") {
    const [statusType, setStatusType] = useState<StatusType>(initialStatus);
    const [message, setMessage] = useState(initialMessage);

    const setStatus = useCallback((newStatus: StatusType, newMessage = "") => {
        setStatusType(newStatus);
        setMessage(translateBackendMessage(newMessage));
    }, []);

    const clear = useCallback(() => {
        setStatus("unknown", "");
    }, [setStatus]);

    return {
        status: statusType,
        message,
        setStatus,
        loading: statusType === "loading",
        clear,
    };
}

export type StatusTracker = ReturnType<typeof useStatusTracker>;