import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RepairStatusPillProps {
    label: string;
    count: number;
    selected: boolean;
    onSelect: () => void;
}

// One status filter in the pill bar, showing how many jobs are in that status
export default function RepairStatusPill({ label, count, selected, onSelect }: RepairStatusPillProps) {
    return (
        <Button
            type="button"
            variant="outline"
            aria-pressed={selected}
            onClick={onSelect}
            className={cn(
                "h-9 gap-2 px-4 transition-colors duration-200 ease-sp-md",
                selected && "border-primary bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
            )}
        >
            {label}
            <span key={count} className={cn("tabular-nums sp-rise-in", selected ? "text-primary-foreground" : "text-muted-foreground")}>
                {count}
            </span>
        </Button>
    );
}
