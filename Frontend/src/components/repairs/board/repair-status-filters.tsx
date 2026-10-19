import useNow from "@/hooks/use-now";
import type { RepairCounts } from "@/lib/repairs/repair-filters";
import { isSameDay } from "@/lib/repairs/repair-format";
import type { RepairJob, StatusFilter } from "@/lib/repairs/repair-types";
import { IconCircleCheck, IconCircleDot, IconListDetails, IconProgress } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import RepairStatusTile from "./repair-status-tile";

interface RepairStatusFiltersProps {
    jobs: RepairJob[];
    counts: RepairCounts;
    selected: StatusFilter;
    onSelect: (status: StatusFilter) => void;
}

// Summary counts for each status, which also act as the status filter for the list
export default function RepairStatusFilters({ jobs, counts, selected, onSelect }: RepairStatusFiltersProps) {
    const { t } = useTranslation();
    const now = useNow();
    const completedToday = jobs.filter((job) => job.completedAt && isSameDay(job.completedAt, now)).length;

    const urgentDetail = (status: StatusFilter) => {
        const urgent = counts.urgent[status];
        return {
            detail: urgent > 0 ? t("repairs.filters.urgentCount", { count: urgent }) : t("repairs.filters.noneUrgent"),
            detailTone: urgent > 0 ? "urgent" as const : "muted" as const,
        };
    };

    return (
        <div role="group" aria-label={t("repairs.filters.statusGroup")} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <RepairStatusTile
                icon={IconListDetails}
                iconClassName="bg-primary/12 text-primary"
                label={t("repairs.filters.all")}
                count={counts.total.All}
                detail={t("repairs.filters.openCount", { count: counts.open })}
                selected={selected === "All"}
                onSelect={() => onSelect("All")}
            />
            <RepairStatusTile
                icon={IconCircleDot}
                iconClassName="bg-info/12 text-info"
                label={t("repairs.status.New")}
                count={counts.total.New}
                {...urgentDetail("New")}
                selected={selected === "New"}
                onSelect={() => onSelect("New")}
            />
            <RepairStatusTile
                icon={IconProgress}
                iconClassName="bg-warning/12 text-warning"
                label={t("repairs.status.InProgress")}
                count={counts.total.InProgress}
                {...urgentDetail("InProgress")}
                selected={selected === "InProgress"}
                onSelect={() => onSelect("InProgress")}
            />
            <RepairStatusTile
                icon={IconCircleCheck}
                iconClassName="bg-success/15 text-success"
                label={t("repairs.status.Completed")}
                count={counts.total.Completed}
                detail={t("repairs.filters.completedToday", { count: completedToday })}
                selected={selected === "Completed"}
                onSelect={() => onSelect("Completed")}
            />
        </div>
    );
}
