import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { IconFilterOff, IconPlus, IconTool } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface RepairEmptyStateProps {
    // True when there are jobs, but the current filters hide all of them
    filtered: boolean;
    onReport: () => void;
    onClearFilters: () => void;
}

export default function RepairEmptyState({ filtered, onReport, onClearFilters }: RepairEmptyStateProps) {
    const { t } = useTranslation();
    const Icon = filtered ? IconFilterOff : IconTool;

    return (
        <Empty className="border bg-card sp-rise-in">
            <EmptyHeader>
                <EmptyMedia variant="icon" className="size-12 rounded-full border bg-card text-primary [&_svg:not([class*='size-'])]:size-6">
                    <Icon />
                </EmptyMedia>
                <EmptyTitle>{t(filtered ? "repairs.empty.filteredTitle" : "repairs.empty.title")}</EmptyTitle>
                <EmptyDescription>{t(filtered ? "repairs.empty.filteredDescription" : "repairs.empty.description")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
                {filtered ? (
                    <Button variant="outline" onClick={onClearFilters}>
                        <IconFilterOff />
                        {t("repairs.actions.clearFilters")}
                    </Button>
                ) : (
                    <Button onClick={onReport}>
                        <IconPlus />
                        {t("repairs.actions.report")}
                    </Button>
                )}
            </EmptyContent>
        </Empty>
    );
}
