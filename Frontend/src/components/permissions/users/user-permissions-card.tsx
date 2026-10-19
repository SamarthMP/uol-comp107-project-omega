import { PermissionRuleEditor } from "@/components/permissions/permission-rule-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import StatusMessage from "@/components/ui/status-message";
import type { BackendErrorLike } from "@/lib/backend-error";
import { getBackendErrorMessage } from "@/lib/backend-error";
import { setUserFlags } from "@/lib/permission-client";
import type { PermissionRule, PermissionRuleMode, UserPermissions } from "@/lib/permission-types";
import useStatusTracker from "@/lib/use-status.tracker";
import { cn } from "@/lib/utils";
import { IconPencil } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface UserPermissionsCardProps {
    user: UserPermissions;
    allFlags: string[];
    onUpdated: (user: UserPermissions) => void;
}

export default function UserPermissionsCard({
    user,
    allFlags,
    onUpdated,
}: UserPermissionsCardProps) {
    const { t } = useTranslation();
    const status = useStatusTracker();
    const [editing, setEditing] = useState(false);
    const [selectedRules, setSelectedRules] = useState<PermissionRule[]>(user.directRules);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setSelectedRules(user.directRules);
    }, [user.directRules]);

    const getRuleMode = (flag: string): PermissionRuleMode => {
        return user.directRules.find((rule) => rule.flag === flag)?.mode ?? "Inherit";
    };

    const handleSave = async () => {
        setSaving(true);
        status.clear();

        try {
            const updatedUser = await setUserFlags(user.userId, selectedRules);
            onUpdated(updatedUser);
            setEditing(false);
        } catch (err) {
            status.setStatus("error", getBackendErrorMessage(err as BackendErrorLike, t("errors.somethingWentWrong")));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">
                    {user.displayName ?? user.email}
                    {user.displayName && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                            {user.email}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <div>
                    <Label className="mb-2 block text-sm font-medium">{t("permissions.effectiveFlags")}</Label>
                    {user.effectiveFlags.length === 0 ? (
                        <span className="text-sm text-muted-foreground">{t("permissions.noFlags")}</span>
                    ) : (
                        <div className="space-y-1">
                            {user.effectiveFlags.map((flag) => (
                                <div key={flag} className="flex items-center gap-2 text-sm">
                                    <span
                                        className={cn(
                                            "size-2 shrink-0 rounded-full",
                                            getRuleMode(flag) === "Allow" ? "bg-primary" : "bg-secondary",
                                        )}
                                    />
                                    <span className="font-medium">{flag}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">{t("permissions.effectiveFlagsHint")}</p>
                </div>

                {user.groups.length > 0 && (
                    <>
                        <Separator />
                        <div>
                            <Label className="mb-2 block text-sm font-medium">{t("permissions.memberOfGroups")}</Label>
                            <div className="space-y-1">
                                {user.groups.map((groupName) => (
                                    <div key={groupName} className="text-sm text-muted-foreground">
                                        {groupName}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <Separator />

                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <Label className="text-sm font-medium">{t("permissions.directFlags")}</Label>
                        {!editing ? (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedRules(user.directRules);
                                    setEditing(true);
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
                                        setEditing(false);
                                        status.clear();
                                    }}
                                >
                                    {t("common.cancel")}
                                </Button>
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving && <Spinner className="mr-1" />}
                                    {t("common.save")}
                                </Button>
                            </div>
                        )}
                    </div>

                    {editing ? (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">{t("permissions.directRulesHint")}</p>
                            <PermissionRuleEditor
                                allFlags={allFlags}
                                rules={selectedRules}
                                onChange={setSelectedRules}
                                compact
                            />
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {user.directRules.length === 0 ? (
                                <span className="text-sm text-muted-foreground">{t("permissions.noRules")}</span>
                            ) : (
                                user.directRules.map((rule) => (
                                    <div key={`${rule.flag}-${rule.mode}`} className="flex items-center gap-2 text-sm">
                                        <span
                                            className={cn(
                                                "size-2 shrink-0 rounded-full",
                                                rule.mode === "Allow" ? "bg-primary" : "bg-destructive",
                                            )}
                                        />
                                        <span className="font-medium">{rule.flag}</span>
                                        <span className="text-muted-foreground">{t(`permissions.ruleMode.${rule.mode}`)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <StatusMessage {...status} />
            </CardContent>
        </Card>
    );
}