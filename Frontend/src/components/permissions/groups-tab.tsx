import CreateGroupForm from "@/components/permissions/groups/groups-tab-create-form";
import GroupDragPreview from "@/components/permissions/groups/groups-tab-drag-preview";
import SortableGroupCard from "@/components/permissions/groups/groups-tab-sortable-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import StatusMessage from "@/components/ui/status-message";
import type { BackendErrorLike } from "@/lib/backend-error";
import { getBackendErrorMessage } from "@/lib/backend-error";
import {
    getAllFlags,
    getCapabilities,
    getPermissionGroups,
    reorderPermissionGroups,
} from "@/lib/permission-client";
import type { PermissionGroup } from "@/lib/permission-types";
import useStatusTracker from "@/lib/use-status.tracker";
import {
    closestCenter,
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { IconPlus } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

export default function GroupsTab() {
    const { t } = useTranslation();
    const status = useStatusTracker();
    const { clear, setStatus } = status;
    const [groups, setGroups] = useState<PermissionGroup[]>([]);
    const [allFlags, setAllFlags] = useState<string[]>([]);
    const [geoCountrySupported, setGeoCountrySupported] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [reordering, setReordering] = useState(false);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [activeGroupWidth, setActiveGroupWidth] = useState<number | null>(null);
    const groupWidthsRef = useRef<Record<string, number>>({});
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
    );

    const load = useCallback(async () => {
        setLoading(true);
        clear();
        try {
            const [groupsData, flagsData, capabilities] = await Promise.all([
                getPermissionGroups(),
                getAllFlags(),
                getCapabilities(),
            ]);
            setGroups(groupsData);
            setAllFlags(flagsData.flags);
            setGeoCountrySupported(capabilities.geoCountrySupported);
        } catch (err) {
            setStatus("error", getBackendErrorMessage(err as BackendErrorLike, t("errors.somethingWentWrong")));
        } finally {
            setLoading(false);
        }
    }, [clear, setStatus, t]);

    useEffect(() => {
        load();
    }, [load]);

    const activeGroup = useMemo(
        () => groups.find((group) => group.id === activeGroupId) ?? null,
        [activeGroupId, groups],
    );

    const handleMeasureGroup = useCallback((groupId: string, width: number) => {
        groupWidthsRef.current[groupId] = width;
    }, []);

    const handleDragStart = (event: DragStartEvent) => {
        const nextActiveId = String(event.active.id);
        setActiveGroupId(nextActiveId);
        setActiveGroupWidth(groupWidthsRef.current[nextActiveId] ?? null);
    };

    const handleDragCancel = () => {
        setActiveGroupId(null);
        setActiveGroupWidth(null);
    };

    const handleReorder = async (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveGroupId(null);
        setActiveGroupWidth(null);

        if (!over || active.id === over.id || reordering) {
            return;
        }

        const oldIndex = groups.findIndex((group) => group.id === active.id);
        const newIndex = groups.findIndex((group) => group.id === over.id);

        if (oldIndex < 0 || newIndex < 0) {
            return;
        }

        const originalGroups = groups;
        const reordered = arrayMove(groups, oldIndex, newIndex);
        setGroups(reordered);
        setReordering(true);
        clear();

        try {
            const nextGroups = await reorderPermissionGroups(reordered.map((group) => group.id));
            setGroups(nextGroups);
        } catch (err) {
            setGroups(originalGroups);
            setStatus("error", getBackendErrorMessage(err as BackendErrorLike, t("errors.somethingWentWrong")));
        } finally {
            setReordering(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                        {t("permissions.groupsDescription")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {t("permissions.groupOrderHint")}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {reordering && (
                        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                            <Spinner className="size-3" />
                            {t("permissions.reorderingGroups")}
                        </span>
                    )}
                    <Button onClick={() => setShowCreate(true)}>
                        <IconPlus />
                        {t("permissions.createGroup")}
                    </Button>
                </div>
            </div>

            <StatusMessage {...status} />

            {showCreate && (
                <CreateGroupForm
                    allFlags={allFlags}
                    geoCountrySupported={geoCountrySupported}
                    onCreated={(group) => {
                        setShowCreate(false);
                        setGroups((currentGroups) => [...currentGroups, group]);
                    }}
                    onCancel={() => setShowCreate(false)}
                />
            )}

            {groups.length === 0 && !showCreate && (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        {t("permissions.noGroups")}
                    </CardContent>
                </Card>
            )}

            {groups.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragCancel={handleDragCancel}
                    onDragEnd={handleReorder}
                >
                    <SortableContext items={groups.map((group) => group.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                            {groups.map((group) => (
                                <SortableGroupCard
                                    key={group.id}
                                    group={group}
                                    allFlags={allFlags}
                                    onUpdated={load}
                                    onMeasure={handleMeasureGroup}
                                />
                            ))}
                        </div>
                    </SortableContext>
                    {createPortal(
                        <DragOverlay adjustScale={false}>
                            {activeGroup ? (
                                <GroupDragPreview group={activeGroup} width={activeGroupWidth} />
                            ) : null}
                        </DragOverlay>,
                        document.body,
                    )}
                </DndContext>
            )}
        </div>
    );
}
