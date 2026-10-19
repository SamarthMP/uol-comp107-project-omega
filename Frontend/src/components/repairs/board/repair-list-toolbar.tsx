import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { RepairFilters, RepairSortOrder } from "@/lib/repairs/repair-types";
import { IconSearch } from "@tabler/icons-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";

const SORT_ORDERS: RepairSortOrder[] = ["newest", "oldest", "urgent", "updated"];

interface RepairListToolbarProps {
    filters: RepairFilters;
    onChange: (filters: RepairFilters) => void;
}

export default function RepairListToolbar({ filters, onChange }: RepairListToolbarProps) {
    const { t } = useTranslation();
    const id = useId();
    const searchId = `${id}-search`;
    const urgentId = `${id}-urgent`;
    const sortId = `${id}-sort`;

    return (
        <div className="flex flex-col gap-3">
            <div className="relative">
                <Label htmlFor={searchId} className="sr-only">{t("repairs.toolbar.searchLabel")}</Label>
                <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                    id={searchId}
                    type="search"
                    value={filters.query}
                    onChange={(event) => onChange({ ...filters, query: event.target.value })}
                    placeholder={t("repairs.toolbar.searchPlaceholder")}
                    className="h-10 bg-card pl-9 text-base sm:text-sm"
                />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="flex items-center gap-2.5">
                    <Switch
                        id={urgentId}
                        checked={filters.urgentOnly}
                        onCheckedChange={(checked) => onChange({ ...filters, urgentOnly: checked })}
                    />
                    <Label htmlFor={urgentId} className="cursor-pointer">{t("repairs.toolbar.urgentOnly")}</Label>
                </div>

                <div className="flex items-center gap-2">
                    <Label htmlFor={sortId} className="text-muted-foreground">{t("repairs.toolbar.sortLabel")}</Label>
                    <Select value={filters.sort} onValueChange={(sort) => onChange({ ...filters, sort: sort as RepairSortOrder })}>
                        <SelectTrigger id={sortId} className="min-w-36 bg-card">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper" align="end">
                            {SORT_ORDERS.map((order) => (
                                <SelectItem key={order} value={order}>{t(`repairs.toolbar.sort.${order}`)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
