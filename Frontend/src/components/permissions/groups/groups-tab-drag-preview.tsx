import { getPermissionGroupTypeLabel } from "@/components/permissions/groups/groups-tab-shared";
import type { PermissionGroup } from "@/lib/permission-types";
import { IconGripVertical, IconUsers } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface GroupDragPreviewProps {
    group: PermissionGroup;
    width: number | null;
}

export default function GroupDragPreview({ group, width }: GroupDragPreviewProps) {
    const { t } = useTranslation();
    const typeLabel = getPermissionGroupTypeLabel(group.type, t);
    const memberCountLabel = group.isDefault ? t("permissions.allUsers") : String(group.memberCount);

    return (
        <div
            style={width ? { width } : undefined}
            className="permissions-drag-overlay relative rounded-lg border border-primary bg-card"
        >
            <div className="absolute left-4 top-4 rounded-md border bg-card p-1 text-muted-foreground">
                <IconGripVertical className="size-4" />
            </div>

            <div className="cursor-grabbing px-6 py-5 pl-14">
                <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="text-base font-semibold">{group.name}</span>
                        <span className="text-xs text-muted-foreground">{typeLabel}</span>
                        {group.isDefault && (
                            <span className="text-xs font-medium text-primary">{t("permissions.defaultGroupBadge")}</span>
                        )}
                        {group.matchValue && (
                            <span className="text-xs text-muted-foreground">&middot; {group.matchValue}</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <IconUsers className="size-3.5" />
                        <span>{memberCountLabel}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}