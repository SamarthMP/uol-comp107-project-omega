import ProfilePictureEditor from "@/components/settings/profile-picture-editor";
import { Avatar, AvatarBadge } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useRealtime } from "@/hooks/use-realtime";
import {
    setProfilePictureUrl,
    updateProfile,
    uploadProfilePicture,
} from "@/lib/auth-client";
import useStatusTracker from "@/lib/use-status.tracker";
import { IconPencil } from "@tabler/icons-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "../ui/spinner";
import StatusMessage from "../ui/status-message";

const DISPLAY_NAME_MAX_LENGTH = 128;

export default function ProfileSection() {
    const { user, refreshUser } = useAuth();
    const { refreshProfile } = useRealtime();
    const { t } = useTranslation();

    const [pendingDisplayName, setPendingDisplayName] = useState<string | null>(null);
    const [pfpEditorOpen, setPfpEditorOpen] = useState(false);

    const displayName = pendingDisplayName ?? user?.displayName ?? "";
    const isDirty = pendingDisplayName !== null && pendingDisplayName.trim() !== (user?.displayName ?? "");
    const status = useStatusTracker();

    // Saves a profile change, then lets everyone else on the board see the new name or picture
    async function applyChange(change: () => Promise<unknown>, failureKey: string) {
        status.setStatus("loading");
        try {
            await change();
            await refreshUser();
            refreshProfile();
            status.setStatus("success", t("success.profileUpdated"));
            return true;
        } catch {
            status.setStatus("error", t(failureKey));
            return false;
        }
    }

    async function handleProfileSave(event: FormEvent) {
        event.preventDefault();
        if (!displayName.trim()) {
            status.setStatus("error", t("profile.displayNameRequired"));
            return;
        }
        if (await applyChange(() => updateProfile(displayName.trim()), "errors.failedToUpdateProfile")) {
            setPendingDisplayName(null);
        }
    }

    async function handlePfpUpload(blob: Blob) {
        if (await applyChange(() => uploadProfilePicture(blob), "errors.failedToUploadProfilePicture")) {
            setPfpEditorOpen(false);
        }
    }

    if (!user) return null;

    return (
        <>
            <Card className="gap-4 p-5 sm:p-6">
                <div>
                    <h2 className="text-lg font-semibold">{t("profile.heading")}</h2>
                    <p className="text-sm text-muted-foreground">{t("profile.description")}</p>
                </div>
                <form onSubmit={handleProfileSave} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <Button
                        type="button"
                        variant="ghost"
                        className="size-auto self-start rounded-full p-0"
                        aria-label={t("profilePicture.edit")}
                        onClick={() => setPfpEditorOpen(true)}
                    >
                        <Avatar user={user} size="lg" className="size-16" key={`pfp-nonce-${pfpEditorOpen}`}>
                            <AvatarBadge>
                                <IconPencil />
                            </AvatarBadge>
                        </Avatar>
                    </Button>
                    <div className="flex w-full flex-col gap-2">
                        <Label htmlFor="displayName">{t("profile.displayName")}</Label>
                        <Input
                            id="displayName"
                            value={displayName}
                            maxLength={DISPLAY_NAME_MAX_LENGTH}
                            autoComplete="name"
                            onChange={(e) => setPendingDisplayName(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={!isDirty || status.loading} className="sm:w-auto">
                        {status.loading ? <Spinner /> : t("profile.saveProfile")}
                    </Button>
                </form>
                <p className="text-sm text-muted-foreground">{t("profile.displayNameHint")}</p>

                <StatusMessage {...status} />
            </Card>

            <ProfilePictureEditor
                open={pfpEditorOpen}
                onClose={() => setPfpEditorOpen(false)}
                onSave={handlePfpUpload}
                onSetUrl={(url) => void applyChange(() => setProfilePictureUrl(url), "errors.failedToSetProfilePictureUrl")}
            />
        </>
    );
}
