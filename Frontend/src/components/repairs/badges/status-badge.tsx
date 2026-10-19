import { Badge } from "@/components/ui/badge";
import type { RepairStatus } from "@/lib/repairs/repair-types";
import { cn } from "@/lib/utils";
import { IconCircleCheck, IconCircleDot, IconProgress } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

const STATUS_STYLES: Record<RepairStatus, { icon: typeof IconCircleDot; className: string }> = {
    New: { icon: IconCircleDot, className: "border-info text-info" },
    InProgress: { icon: IconProgress, className: "border-warning text-warning" },
    Completed: { icon: IconCircleCheck, className: "border-success text-success" },
};

interface StatusBadgeProps {
    status: RepairStatus;
    className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
    const { t } = useTranslation();
    const { icon: Icon, className: toneClassName } = STATUS_STYLES[status];

    return (
        <Badge variant="outline" className={cn("h-6 gap-1 bg-card px-2.5 text-sm font-semibold [&>svg]:size-3.5!", toneClassName, className)}>
            <Icon aria-hidden />
            <span className="sr-only">{t("repairs.status.label")}:</span>
            {t(`repairs.status.${status}`)}
        </Badge>
    );
}
