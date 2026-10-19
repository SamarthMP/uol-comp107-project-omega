import { cn } from "@/lib/utils";

// Meadow House Repairs mark: a house outline with a sprouting meadow leaf
export default function AppLogo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={cn("size-9 shrink-0", className)}>
            <rect width="32" height="32" rx="8" className="fill-primary" />
            <g
                fill="none"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-primary-foreground"
            >
                <path d="M6.5 15 16 7.5l9.5 7.5" />
                <path d="M9 13.5V24h14V13.5" />
                <path d="M16 24v-5.5" />
            </g>
            <path
                className="fill-primary-foreground"
                d="M16 19.5c-2.6 0-4-1.6-4-4 2.6 0 4 1.6 4 4Zm0-1c0-2.4 1.4-4 4-4 0 2.4-1.4 4-4 4Z"
            />
        </svg>
    );
}
