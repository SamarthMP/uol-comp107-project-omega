import { Avatar, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { useRealtime } from "@/hooks/use-realtime";
import { useRepairs } from "@/hooks/use-repairs";
import { jobRoute } from "@/lib/routes";
import { IconEye } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

const MAX_VISIBLE = 3;

// Who else is on the board right now, and which repair each person has open
export default function OnlineUsers() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { onlineUsers } = useRealtime();
    const { jobs } = useRepairs();
    const [open, setOpen] = useState(false);

    if (onlineUsers.length === 0) return null;

    const visible = onlineUsers.slice(0, MAX_VISIBLE);
    const hidden = onlineUsers.length - visible.length;
    const referenceFor = (jobId: number) => jobs.find((job) => job.id === jobId)?.reference;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 rounded-full px-2" aria-label={t("presence.onlineButton", { count: onlineUsers.length })}>
                    <AvatarGroup>
                        {visible.map((person) => (
                            <Avatar
                                key={person.userId}
                                className="size-7 ring-2 ring-background"
                                user={{ displayName: person.displayName, profilePictureUrl: person.profilePictureUrl }}
                            />
                        ))}
                        {hidden > 0 && <AvatarGroupCount className="size-7">+{hidden}</AvatarGroupCount>}
                    </AvatarGroup>
                    <span className="hidden text-sm font-medium sm:inline">{t("presence.onlineCount", { count: onlineUsers.length })}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-3">
                <p className="mb-2 text-sm font-semibold">{t("presence.onlineTitle")}</p>
                <ul className="flex flex-col gap-2">
                    {onlineUsers.map((person) => (
                        <li key={person.userId} className="flex items-start gap-2.5">
                            <Avatar className="size-8" user={{ displayName: person.displayName, profilePictureUrl: person.profilePictureUrl }} />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {person.displayName}
                                    {person.userId === user?.id && <span className="text-muted-foreground"> {t("presence.you")}</span>}
                                </p>
                                {person.viewingJobIds.length > 0 ? (
                                    <p className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                                        <IconEye className="size-3.5" aria-hidden />
                                        {t("presence.viewing")}
                                        {person.viewingJobIds.map((jobId) => (
                                            <Link key={jobId} to={jobRoute(jobId)} onClick={() => setOpen(false)} className="font-medium text-primary underline-offset-2 hover:underline">
                                                {referenceFor(jobId) ?? jobId}
                                            </Link>
                                        ))}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{t("presence.browsing")}</p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </PopoverContent>
        </Popover>
    );
}
