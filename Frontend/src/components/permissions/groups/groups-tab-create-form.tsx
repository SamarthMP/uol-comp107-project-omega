import MultiSelectDropdown from "@/components/permissions/groups/groups-tab-multi-select-dropdown";
import { BROWSER_OPTIONS, OS_OPTIONS, type PermissionGroupTypeOption } from "@/components/permissions/groups/groups-tab-shared";
import { PermissionRuleEditor } from "@/components/permissions/permission-rule-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import StatusMessage from "@/components/ui/status-message";
import type { BackendErrorLike } from "@/lib/backend-error";
import { getBackendErrorMessage } from "@/lib/backend-error";
import { createPermissionGroup } from "@/lib/permission-client";
import type { PermissionGroup, PermissionGroupType, PermissionRule } from "@/lib/permission-types";
import useStatusTracker from "@/lib/use-status.tracker";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface CreateGroupFormProps {
    allFlags: string[];
    geoCountrySupported: boolean;
    onCreated: (group: PermissionGroup) => void;
    onCancel: () => void;
}

export default function CreateGroupForm({
    allFlags,
    geoCountrySupported,
    onCreated,
    onCancel,
}: CreateGroupFormProps) {
    const { t } = useTranslation();
    const status = useStatusTracker();
    const [name, setName] = useState("");
    const [type, setType] = useState<PermissionGroupType>("Manual");
    const [matchValue, setMatchValue] = useState("");
    const [rules, setRules] = useState<PermissionRule[]>([]);

    const availableTypes = useMemo(() => {
        const types: PermissionGroupTypeOption[] = [
            { value: "Manual", label: t("permissions.typeManual") },
        ];

        if (geoCountrySupported) {
            types.push({ value: "Country", label: t("permissions.typeCountry") });
        }

        types.push(
            { value: "Browser", label: t("permissions.typeBrowser") },
            { value: "OperatingSystem", label: t("permissions.typeOS") },
        );

        return types;
    }, [geoCountrySupported, t]);

    const handleSubmit = async () => {
        status.setStatus("loading");

        try {
            const group = await createPermissionGroup({
                name: name.trim(),
                type,
                matchValue: type !== "Manual" ? matchValue.trim() || undefined : undefined,
                rules,
            });

            status.clear();
            onCreated(group);
        } catch (err) {
            status.setStatus("error", getBackendErrorMessage(err as BackendErrorLike, t("errors.somethingWentWrong")));
        }
    };

    const handleTypeChange = (nextType: string) => {
        setType(nextType as PermissionGroupType);
        setMatchValue("");
        status.clear();
    };

    return (
        <Card className="border-primary/20 shadow-sm">
            <CardHeader>
                <CardTitle className="text-base">{t("permissions.createGroup")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>{t("permissions.groupName")}</Label>
                        <Input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder={t("permissions.groupNamePlaceholder")}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>{t("permissions.groupType")}</Label>
                        <Select value={type} onValueChange={handleTypeChange}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTypes.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {type === "Country" && (
                    <div className="space-y-2">
                        <Label>{t("permissions.matchValue")}</Label>
                        <Input
                            value={matchValue}
                            onChange={(event) => setMatchValue(event.target.value)}
                            placeholder={t("permissions.matchCountryPlaceholder")}
                        />
                    </div>
                )}

                {(type === "Browser" || type === "OperatingSystem") && (
                    <div className="space-y-2">
                        <Label>{t("permissions.matchValue")}</Label>
                        <MultiSelectDropdown
                            options={type === "Browser" ? BROWSER_OPTIONS : OS_OPTIONS}
                            value={matchValue}
                            onChange={setMatchValue}
                            placeholder={type === "Browser"
                                ? t("permissions.matchBrowserPlaceholder")
                                : t("permissions.matchOSPlaceholder")}
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <Label>{t("permissions.flags")}</Label>
                    <PermissionRuleEditor allFlags={allFlags} rules={rules} onChange={setRules} />
                </div>

                <StatusMessage {...status} />

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onCancel} disabled={status.loading}>
                        {t("common.cancel")}
                    </Button>
                    <Button onClick={handleSubmit} disabled={status.loading || !name.trim()}>
                        {status.loading && <Spinner className="mr-2" />}
                        {t("permissions.createGroup")}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}