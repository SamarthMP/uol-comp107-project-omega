import type { RepairCounts } from "@/lib/repairs/repair-filters";
import type { StatusFilter } from "@/lib/repairs/repair-types";
import { useTranslation } from "react-i18next";
import RepairStatusPill from "./repair-status-pill";

const STATUS_FILTERS: { value: StatusFilter; labelKey: string }[] = [
    { value: "All", labelKey: "repairs.filters.all" },
    { value: "New", labelKey: "repairs.status.New" },
    { value: "InProgress", labelKey: "repairs.status.InProgress" },
    { value: "Completed", labelKey: "repairs.status.Completed" },
];

interface RepairStatusFiltersProps {
    counts: RepairCounts;
    selected: StatusFilter;
    onSelect: (status: StatusFilter) => void;
}

// Pill bar of status filters for the list, each with its job count
export default function RepairStatusFilters({ counts, selected, onSelect }: RepairStatusFiltersProps) {
    const { t } = useTranslation();

    return (
        <div role="group" aria-label={t("repairs.filters.statusGroup")} className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map(({ value, labelKey }) => (
                <RepairStatusPill
                    key={value}
                    label={t(labelKey)}
                    count={counts.total[value]}
                    selected={selected === value}
                    onSelect={() => onSelect(value)}
                />
            ))}
        </div>
    );
}
