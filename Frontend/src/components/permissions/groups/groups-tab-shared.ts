import type { PermissionGroupType } from "@/lib/permission-types";
import type { TFunction } from "i18next";

export const BROWSER_OPTIONS = ["Chrome", "Firefox", "Safari", "Edge", "Opera"];
export const OS_OPTIONS = ["Windows", "macOS", "Linux", "Android", "iOS", "ChromeOS"];

export interface PermissionGroupTypeOption {
    value: PermissionGroupType;
    label: string;
}

export function getPermissionGroupTypeLabel(groupType: PermissionGroupType, t: TFunction) {
    switch (groupType) {
        case "Manual":
            return t("permissions.typeManual");
        case "Country":
            return t("permissions.typeCountry");
        case "Browser":
            return t("permissions.typeBrowser");
        case "OperatingSystem":
            return t("permissions.typeOS");
        default:
            return groupType;
    }
}