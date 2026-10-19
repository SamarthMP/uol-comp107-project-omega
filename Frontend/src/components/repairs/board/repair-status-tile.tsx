import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TablerIcon } from "@tabler/icons-react";

interface RepairStatusTileProps {
    icon: TablerIcon;
    label: string;
    count: number;
    detail: string;
    detailTone?: "muted" | "urgent";
    iconClassName: string;
    selected: boolean;
    onSelect: () => void;
}

// A count of jobs in one status that doubles as a filter toggle
export default function RepairStatusTile({ icon: Icon, label, count, detail, detailTone = "muted", iconClassName, selected, onSelect }: RepairStatusTileProps) {
    return (
        <Button
            type="button"
            variant="outline"
            aria-pressed={selected}
            onClick={onSelect}
            className={cn(
                "h-auto flex-col items-stretch gap-2 rounded-xl bg-card p-3 text-left whitespace-normal shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm sm:p-4",
                selected && "border-primary bg-accent ring-2 ring-primary/40 hover:border-primary"
            )}
        >
            <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{label}</span>
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", iconClassName)} aria-hidden>
                    <Icon className="size-4" />
                </span>
            </span>
            <span key={count} className="text-3xl leading-none font-bold tabular-nums text-foreground sp-rise-in">{count}</span>
            <span className={cn("text-sm font-medium", detailTone === "urgent" ? "text-destructive" : "text-muted-foreground")}>
                {detail}
            </span>
        </Button>
    );
}
