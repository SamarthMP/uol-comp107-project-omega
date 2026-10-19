import { Avatar, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { OnlineUser } from "@/lib/repairs/repair-types";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const MAX_VISIBLE = 3;

interface ViewerAvatarsProps {
    users: OnlineUser[];
    className?: string;
    size?: "sm" | "default";
}

// Stacked avatars of the other people currently looking at the same job
export default function ViewerAvatars({ users, className, size = "default" }: ViewerAvatarsProps) {
    const { t } = useTranslation();

    if (users.length === 0) return null;

    const names = users.map((user) => user.displayName).join(", ");
    const label = t("presence.alsoViewing", { names });
    const visible = users.slice(0, MAX_VISIBLE);
    const hidden = users.length - visible.length;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    role="img"
                    aria-label={label}
                    className={cn("inline-flex items-center text-sm text-muted-foreground sp-rise-in", className)}
                >
                    <AvatarGroup>
                        {visible.map((user) => (
                            <Avatar
                                key={user.userId}
                                size={size}
                                user={{ displayName: user.displayName, profilePictureUrl: user.profilePictureUrl }}
                                className={cn(size === "sm" ? "size-6" : "size-7", "ring-2 ring-background")}
                            />
                        ))}
                        {hidden > 0 && <AvatarGroupCount className={size === "sm" ? "size-6" : "size-7"}>+{hidden}</AvatarGroupCount>}
                    </AvatarGroup>
                </span>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
}
