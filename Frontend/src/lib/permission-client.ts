import { request } from "./auth-client";
import type {
    PermissionGroup,
    PermissionGroupMember,
    PermissionGroupType,
    PermissionRule,
    UserPermissions,
    UserSearchResult,
} from "./permission-types";

export function getAllFlags() {
    return request<{ flags: string[] }>("/permissions/flags");
}

export function getCapabilities() {
    return request<{ geoCountrySupported: boolean }>("/permissions/capabilities");
}

export function getPermissionGroups() {
    return request<PermissionGroup[]>("/permissions/groups");
}

export function createPermissionGroup(data: {
    name: string;
    type: PermissionGroupType;
    matchValue?: string;
    rules: PermissionRule[];
}) {
    return request<PermissionGroup>("/permissions/groups", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function updatePermissionGroup(
    groupId: string,
    data: { name?: string; rules?: PermissionRule[] },
) {
    return request<PermissionGroup>(`/permissions/groups/${encodeURIComponent(groupId)}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export function reorderPermissionGroups(groupIds: string[]) {
    return request<PermissionGroup[]>("/permissions/groups/order", {
        method: "PUT",
        body: JSON.stringify({ groupIds }),
    });
}

export function deletePermissionGroup(groupId: string) {
    return request<void>(`/permissions/groups/${encodeURIComponent(groupId)}`, {
        method: "DELETE",
    });
}

export function getGroupMembers(groupId: string) {
    return request<PermissionGroupMember[]>(
        `/permissions/groups/${encodeURIComponent(groupId)}/members`,
    );
}

export function addGroupMember(groupId: string, userId: string) {
    return request<PermissionGroupMember>(
        `/permissions/groups/${encodeURIComponent(groupId)}/members`,
        { method: "POST", body: JSON.stringify({ userId }) },
    );
}

export function removeGroupMember(groupId: string, userId: string) {
    return request<void>(
        `/permissions/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`,
        { method: "DELETE" },
    );
}

export function getUserPermissions(userId: string) {
    return request<UserPermissions>(`/permissions/users/${encodeURIComponent(userId)}`);
}

export function setUserFlags(userId: string, rules: PermissionRule[]) {
    return request<UserPermissions>(`/permissions/users/${encodeURIComponent(userId)}/flags`, {
        method: "PUT",
        body: JSON.stringify({ rules }),
    });
}

export function searchUsers(q: string) {
    return request<UserSearchResult[]>(`/permissions/users/search?q=${encodeURIComponent(q)}`);
}
