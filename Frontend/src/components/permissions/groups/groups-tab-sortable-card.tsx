import DragHandle from "@/components/permissions/groups/groups-tab-drag-handle";
import GroupCard from "@/components/permissions/groups/groups-tab-group-card";
import type { PermissionGroup } from "@/lib/permission-types";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback } from "react";

interface SortableGroupCardProps {
    group: PermissionGroup;
    allFlags: string[];
    onUpdated: () => Promise<void>;
    onMeasure: (groupId: string, width: number) => void;
}

export default function SortableGroupCard({
    group,
    allFlags,
    onUpdated,
    onMeasure,
}: SortableGroupCardProps) {
    const {
        attributes,
        listeners,
        setActivatorNodeRef,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: group.id });

    const setMeasuredNodeRef = useCallback((element: HTMLDivElement | null) => {
        setNodeRef(element);

        if (element) {
            onMeasure(group.id, element.getBoundingClientRect().width);
        }
    }, [group.id, onMeasure, setNodeRef]);

    return (
        <div
            ref={setMeasuredNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn(
                "permissions-sort-item relative transition-[transform,box-shadow,opacity] duration-200",
                isDragging && "z-10 opacity-30",
            )}
        >
            <DragHandle
                setActivatorNodeRef={setActivatorNodeRef}
                attributes={attributes}
                listeners={listeners}
            />
            <GroupCard group={group} allFlags={allFlags} onUpdated={onUpdated} />
        </div>
    );
}