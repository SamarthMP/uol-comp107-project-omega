import { Badge } from "@/components/ui/badge";
import type { RepairPriority } from "@/lib/repairs/repair-types";
import { cn } from "@/lib/utils";
import { IconAlertTriangleFilled, IconFlag } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface PriorityBadgeProps {
    priority: RepairPriority;
    className?: string;
}

// Urgent is always spelled out in words, never conveyed by colour alone
export default function PriorityBadge({ priority, className }: PriorityBadgeProps) {
    const { t } = useTranslation();
    const urgent = priority === "Urgent";

    return (
        <Badge
            className={cn(
                "h-6 gap-1 px-2.5 text-sm font-semibold [&>svg]:size-3.5!",
                urgent
                    ? "bg-destructive text-destructive-foreground"
                    : "border-border bg-muted text-muted-foreground",
                className
            )}
        >
            {urgent ? <IconAlertTriangleFilled aria-hidden /> : <IconFlag aria-hidden />}
            <span className="sr-only">{t("repairs.priority.label")}:</span>
            {t(`repairs.priority.${priority}`)}
        </Badge>
    );
}
