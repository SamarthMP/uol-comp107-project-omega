import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import StatusMessage from "@/components/ui/status-message";
import type { BackendErrorLike } from "@/lib/backend-error";
import { getBackendErrorMessage } from "@/lib/backend-error";
import {
    addGroupMember,
    getGroupMembers,
    removeGroupMember,
    searchUsers,
} from "@/lib/permission-client";
import type { PermissionGroupMember, UserSearchResult } from "@/lib/permission-types";
import useStatusTracker from "@/lib/use-status.tracker";
import { IconSearch, IconUserPlus, IconX } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface MembersPanelProps {
    groupId: string;
    onChanged: () => Promise<void>;
}

export default function MembersPanel({ groupId, onChanged }: MembersPanelProps) {
    const { t } = useTranslation();
    const status = useStatusTracker();
    const { clear, setStatus } = status;
    const [members, setMembers] = useState<PermissionGroupMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const loadMembers = useCallback(async () => {
        setLoading(true);

        try {
            setMembers(await getGroupMembers(groupId));
        } catch (err) {
            setStatus("error", getBackendErrorMessage(err as BackendErrorLike, t("errors.somethingWentWrong")));
        } finally {
            setLoading(false);
        }
    }, [groupId, setStatus, t]);

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

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

    const handleAdd = async (userId: string) => {
        clear();

        try {
            await addGroupMember(groupId, userId);
            setSearchQuery("");
            setSearchResults([]);
            await loadMembers();
            await onChanged();
        } catch (err) {
            setStatus("error", getBackendErrorMessage(err as BackendErrorLike, t("errors.somethingWentWrong")));
        }
    };

    const handleRemove = async (userId: string) => {
        clear();

        try {
            await removeGroupMember(groupId, userId);
            await loadMembers();
            await onChanged();
        } catch (err) {
            setStatus("error", getBackendErrorMessage(err as BackendErrorLike, t("errors.somethingWentWrong")));
        }
    };

    if (loading) {
        return <Skeleton className="h-16 w-full" />;
    }

    const memberIds = new Set(members.map((member) => member.userId));

    return (
        <div className="space-y-3">
            <StatusMessage {...status} />

            <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    className="pl-9"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t("permissions.searchUsersPlaceholder")}
                />
                {searching && <Spinner className="absolute right-3 top-1/2 -translate-y-1/2" />}
            </div>

            {searchResults.length > 0 && (
                <div className="max-h-40 divide-y overflow-y-auto rounded-md border">
                    {searchResults
                        .filter((user) => !memberIds.has(user.id))
                        .map((user) => (
                            <div key={user.id} className="flex items-center justify-between px-3 py-2 text-sm">
                                <span>
                                    {user.displayName ?? user.email}
                                    {user.displayName && (
                                        <span className="ml-1 text-muted-foreground">({user.email})</span>
                                    )}
                                </span>
                                <Button variant="ghost" size="icon" onClick={() => handleAdd(user.id)}>
                                    <IconUserPlus className="size-4" />
                                </Button>
                            </div>
                        ))}
                </div>
            )}

            {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("permissions.noMembers")}</p>
            ) : (
                <div className="divide-y rounded-md border">
                    {members.map((member) => (
                        <div key={member.userId} className="flex items-center justify-between px-3 py-2 text-sm">
                            <span>
                                {member.displayName ?? member.email}
                                {member.displayName && (
                                    <span className="ml-1 text-muted-foreground">({member.email})</span>
                                )}
                            </span>
                            <Button variant="ghost" size="icon" onClick={() => handleRemove(member.userId)}>
                                <IconX className="size-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}