import MembersPanel from "@/components/permissions/groups/groups-tab-members-panel";
import { getPermissionGroupTypeLabel } from "@/components/permissions/groups/groups-tab-shared";
import { PermissionRuleEditor } from "@/components/permissions/permission-rule-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import StatusMessage from "@/components/ui/status-message";
import type { BackendErrorLike } from "@/lib/backend-error";
import { getBackendErrorMessage } from "@/lib/backend-error";
import { deletePermissionGroup, updatePermissionGroup } from "@/lib/permission-client";
import type { PermissionGroup, PermissionRule } from "@/lib/permission-types";
import useStatusTracker from "@/lib/use-status.tracker";
import { cn } from "@/lib/utils";
import { IconChevronDown, IconChevronRight, IconPencil, IconTrash, IconUsers } from "@tabler/icons-react";
import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface GroupCardProps {
    group: PermissionGroup;
    allFlags: string[];
    onUpdated: () => Promise<void>;
}

function GroupCard({ group, allFlags, onUpdated }: GroupCardProps) {
    const { t } = useTranslation();
    const status = useStatusTracker();
    const [expanded, setExpanded] = useState(false);
    const [editingRules, setEditingRules] = useState(false);
    const [selectedRules, setSelectedRules] = useState<PermissionRule[]>(group.rules);
    const [savingRules, setSavingRules] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const canManageMembers = group.type === "Manual" && !group.isDefault;
    const typeLabel = getPermissionGroupTypeLabel(group.type, t);

    useEffect(() => {
        setSelectedRules(group.rules);
    }, [group.rules]);

    const rulesSummary = useMemo(() => {
        if (group.rules.length === 0) {
            return t("permissions.noRules");
        }

        return group.rules
            .map((rule) => `${rule.flag}: ${t(`permissions.ruleMode.${rule.mode}`)}`)
            .join(", ");
    }, [group.rules, t]);

    const handleSaveRules = async () => {
        setSavingRules(true);
        status.clear();

        try {
            await updatePermissionGroup(group.id, { rules: selectedRules });
            setEditingRules(false);
            await onUpdated();
        } catch (err) {
            status.setStatus("error", getBackendErrorMessage(err as BackendErrorLike, t("errors.somethingWentWrong")));
        } finally {
            setSavingRules(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        status.clear();

        try {
            await deletePermissionGroup(group.id);
            await onUpdated();
        } catch (err) {
            status.setStatus("error", getBackendErrorMessage(err as BackendErrorLike, t("errors.somethingWentWrong")));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Card className="overflow-hidden transition-colors duration-200 hover:border-input">
            <CardHeader className="cursor-pointer pl-14" onClick={() => setExpanded((current) => !current)}>
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-3">
                            <CardTitle className="text-base">{group.name}</CardTitle>
                            <span className="text-xs text-muted-foreground">{typeLabel}</span>
                            {group.isDefault && (
                                <span className="text-xs font-medium text-primary">{t("permissions.defaultGroupBadge")}</span>
                            )}
                            {group.matchValue && (
                                <span className="text-xs text-muted-foreground">&middot; {group.matchValue}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="truncate">{rulesSummary}</span>
                        </div>
                    </div>

                    {expanded ? (
                        <IconChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform" />
                    ) : (
                        <IconChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform" />
                    )}
                </div>
            </CardHeader>

            {expanded && (
                <CardContent className="space-y-4">
                    <Separator />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <Label className="text-sm font-medium">{t("permissions.flags")}</Label>

                            {!editingRules ? (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedRules(group.rules);
                                        setEditingRules(true);
                                        status.clear();
                                    }}
                                >
                                    <IconPencil />
                                    {t("permissions.editFlags")}
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setEditingRules(false);
                                            status.clear();
                                        }}
                                    >
                                        {t("common.cancel")}
                                    </Button>
                                    <Button onClick={handleSaveRules} disabled={savingRules}>
                                        {savingRules && <Spinner className="mr-1" />}
                                        {t("common.save")}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {editingRules ? (
                            <PermissionRuleEditor allFlags={allFlags} rules={selectedRules} onChange={setSelectedRules} />
                        ) : (
                            <div className="rounded-lg border p-3">
                                {group.rules.length === 0 ? (
                                    <span className="text-sm text-muted-foreground">{t("permissions.noRules")}</span>
                                ) : (
                                    <div className="space-y-1">
                                        {group.rules.map((rule) => (
                                            <div key={`${group.id}-${rule.flag}-expanded`} className="flex items-center gap-2 text-sm">
                                                <span
                                                    className={cn(
                                                        "size-2 shrink-0 rounded-full",
                                                        rule.mode === "Allow" ? "bg-primary" : "bg-destructive",
                                                    )}
                                                />
                                                <span className="font-medium">{rule.flag}</span>
                                                <span className="text-muted-foreground">{t(`permissions.ruleMode.${rule.mode}`)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {group.type === "Manual" && (
                        <>
                            <Separator />
                            <div>
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <Label className="text-sm font-medium">{t("permissions.members")}</Label>

                                    {canManageMembers ? (
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowMembers((current) => !current)}
                                        >
                                            <IconUsers />
                                            {showMembers ? t("permissions.hideMembers") : t("permissions.manageMembers")}
                                        </Button>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">
                                            {t("permissions.defaultGroupMembersHint")}
                                        </span>
                                    )}
                                </div>

                                {showMembers && canManageMembers && (
                                    <MembersPanel groupId={group.id} onChanged={onUpdated} />
                                )}
                            </div>
                        </>
                    )}

                    <StatusMessage {...status} />

                    {!group.isDefault && (
                        <>
                            <Separator />
                            <div className="flex justify-end">
                                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                                    {deleting ? <Spinner /> : <IconTrash />}
                                    {t("permissions.deleteGroup")}
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

export default memo(GroupCard);