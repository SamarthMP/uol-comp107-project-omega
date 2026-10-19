import UserPermissionsCard from "@/components/permissions/users/user-permissions-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import StatusMessage from "@/components/ui/status-message";
import type { BackendErrorLike } from "@/lib/backend-error";
import { getBackendErrorMessage } from "@/lib/backend-error";
import { getAllFlags, getUserPermissions, searchUsers } from "@/lib/permission-client";
import type { UserPermissions, UserSearchResult } from "@/lib/permission-types";
import useStatusTracker from "@/lib/use-status.tracker";
import { IconSearch } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export default function UsersTab() {
    const { t } = useTranslation();
    const status = useStatusTracker();
    const { clear, setStatus } = status;
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserPermissions | null>(null);
    const [allFlags, setAllFlags] = useState<string[]>([]);
    const [loadingUser, setLoadingUser] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        getAllFlags()
            .then((flagsResponse) => {
                setAllFlags(flagsResponse.flags);
            })
            .catch((err: unknown) => {
                setStatus("error", getBackendErrorMessage(err as BackendErrorLike, t("errors.somethingWentWrong")));
            });
    }, [setStatus, t]);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (searchQuery.length < 2) {
            setSearchResults([]);
            setSearching(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                setSearchResults(await searchUsers(searchQuery));
            } catch (err) {
                setStatus("error", getBackendErrorMessage(err as BackendErrorLike, t("errors.somethingWentWrong")));
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchQuery, setStatus, t]);

    const selectUser = useCallback(async (userId: string) => {
        setLoadingUser(true);
        setSearchResults([]);
        setSearchQuery("");
        clear();

        try {
            setSelectedUser(await getUserPermissions(userId));
        } catch (err) {
            setStatus("error", getBackendErrorMessage(err as BackendErrorLike, t("errors.somethingWentWrong")));
        } finally {
            setLoadingUser(false);
        }
    }, [clear, setStatus, t]);

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("permissions.usersDescription")}</p>

            <StatusMessage {...status} />

            <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("permissions.searchUsersPlaceholder")}
                />
                {searching && (
                    <Spinner className="absolute right-3 top-1/2 -translate-y-1/2" />
                )}
            </div>

            {searchResults.length > 0 && (
                <div className="border rounded-lg bg-card divide-y max-h-60 overflow-y-auto">
                    {searchResults.map((user) => (
                        <button
                            key={user.id}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                            onClick={() => selectUser(user.id)}
                        >
                            <span>
                                {user.displayName ?? user.email}
                                {user.displayName && (
                                    <span className="text-muted-foreground ml-1">({user.email})</span>
                                )}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {loadingUser && <Skeleton className="h-40 w-full" />}

            {selectedUser && !loadingUser && (
                <UserPermissionsCard
                    user={selectedUser}
                    allFlags={allFlags}
                    onUpdated={(u) => setSelectedUser(u)}
                />
            )}
        </div>
    );
}
