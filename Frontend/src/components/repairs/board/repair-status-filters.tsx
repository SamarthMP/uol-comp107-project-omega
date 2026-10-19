import { ButtonGroup } from "@/components/ui/button-group";
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

// Segmented status filter for the list, each segment with its job count.
// On narrow screens the strip scrolls sideways instead of wrapping, so the segments stay joined.
export default function RepairStatusFilters({ counts, selected, onSelect }: RepairStatusFiltersProps) {
    const { t } = useTranslation();

    return (
        <div className="-mx-4 -my-1 overflow-x-auto px-4 py-1 sm:mx-0 sm:my-0 sm:overflow-visible sm:px-0 sm:py-0">
            <ButtonGroup aria-label={t("repairs.filters.statusGroup")} className="w-max">
                {STATUS_FILTERS.map(({ value, labelKey }) => (
                    <RepairStatusPill
                        key={value}
                        label={t(labelKey)}
                        count={counts.total[value]}
                        selected={selected === value}
                        onSelect={() => onSelect(value)}
                    />
                ))}
            </ButtonGroup>
        </div>
    );
}
