import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRealtime } from "@/hooks/use-realtime";
import type { RealtimeState } from "@/lib/repairs/repair-types";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const STATE_STYLES: Record<RealtimeState, { dot: string; pill: string; pulse: boolean }> = {
    connected: { dot: "bg-success", pill: "border-success/30 text-success", pulse: true },
    connecting: { dot: "bg-muted-foreground", pill: "border-border text-muted-foreground", pulse: false },
    reconnecting: { dot: "bg-warning", pill: "border-warning/40 text-warning", pulse: false },
    disconnected: { dot: "bg-destructive", pill: "border-destructive/40 text-destructive", pulse: false },
};

// Shows whether live updates are flowing, so people know if the board is up to date
export default function ConnectionIndicator({ className }: { className?: string }) {
    const { t } = useTranslation();
    const { state } = useRealtime();
    const styles = STATE_STYLES[state];

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    role="status"
                    tabIndex={0}
                    className={cn(
                        "inline-flex h-8 min-w-8 items-center justify-center gap-2 rounded-full border bg-card px-2.5 text-sm font-medium sm:px-3 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
                        styles.pill,
                        className
                    )}
                >
                    <span className="relative flex size-2" aria-hidden>
                        {styles.pulse && <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", styles.dot)} />}
                        <span className={cn("relative inline-flex size-2 rounded-full", styles.dot)} />
                    </span>
                    <span className="sr-only sm:not-sr-only">{t(`presence.connection.${state}`)}</span>
                </span>
            </TooltipTrigger>
            <TooltipContent>{t(`presence.connectionHint.${state}`)}</TooltipContent>
        </Tooltip>
    );
}
