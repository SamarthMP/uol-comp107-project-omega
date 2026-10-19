export type PermissionRuleMode = "Inherit" | "Allow" | "Block";
export type PermissionGroupType = "Manual" | "Country" | "Browser" | "OperatingSystem";

export interface PermissionRule {
    flag: string;
    mode: PermissionRuleMode;
}

export interface PermissionGroup {
    id: string;
    name: string;
    type: PermissionGroupType;
    isDefault: boolean;
    matchValue: string | null;
    priority: number;
    createdAt: string;
    rules: PermissionRule[];
    memberCount: number;
}

export interface PermissionGroupMember {
    userId: string;
    email: string | null;
    displayName: string | null;
}

export interface UserPermissions {
    userId: string;
    email: string | null;
    displayName: string | null;
    directRules: PermissionRule[];
    effectiveFlags: string[];
    groups: string[];
}

export interface UserSearchResult {
    id: string;
    email: string | null;
    displayName: string | null;
}
