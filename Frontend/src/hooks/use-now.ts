import { useSyncExternalStore } from "react";

const TICK_MS = 30_000;

let currentNow = Date.now();
let timer: number | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
    listeners.add(listener);

    if (timer === undefined) {
        currentNow = Date.now();
        timer = window.setInterval(() => {
            currentNow = Date.now();
            listeners.forEach((notify) => notify());
        }, TICK_MS);
    }

    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
            window.clearInterval(timer);
            timer = undefined;
        }
    };
}

function getSnapshot() {
    return currentNow;
}

// A shared clock that ticks every 30 seconds, used to keep relative times like "5 minutes ago" fresh
export default function useNow() {
    return useSyncExternalStore(subscribe, getSnapshot);
}
