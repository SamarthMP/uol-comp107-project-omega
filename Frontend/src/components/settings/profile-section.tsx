import ChangeEmailDialog from "@/components/auth/change-email-dialog";
import ProfilePictureEditor from "@/components/settings/profile-picture-editor";
import { Avatar, AvatarBadge } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useEmailFeature } from "@/hooks/use-email-feature";
import {
    deleteProfilePicture,
    setProfilePictureUrl,
    updateProfile,
    uploadProfilePicture,
} from "@/lib/auth-client";
import routes from "@/lib/routes";
import useStatusTracker from "@/lib/use-status.tracker";
import { IconAlertTriangle, IconCircleCheck, IconPencil } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Spinner } from "../ui/spinner";
import StatusMessage from "../ui/status-message";

interface ProfileSectionProps {
    onRequireSudo: (action: () => void) => void;
}

export default function ProfileSection({ onRequireSudo }: ProfileSectionProps) {
    const { user, refreshUser } = useAuth();
    const { t } = useTranslation();
    const { emailEnabled } = useEmailFeature();

    const [pendingDisplayName, setPendingDisplayName] = useState<string | null>(null);
    const [pfpEditorOpen, setPfpEditorOpen] = useState(false);
    const [changeEmailOpen, setChangeEmailOpen] = useState(false);

    const displayName = pendingDisplayName ?? user?.displayName ?? "";
    const isDirty = pendingDisplayName !== null && pendingDisplayName !== (user?.displayName ?? "");
    const status = useStatusTracker();

    async function handleProfileSave() {
        status.setStatus("loading");
        try {
            await updateProfile(displayName);
            await refreshUser();
            setPendingDisplayName(null);
            status.setStatus("success", t("success.profileUpdated"));
        } catch {
            status.setStatus("error", t("errors.failedToUpdateProfile"));
        }
    }

    async function handlePfpUpload(blob: Blob) {
        status.setStatus("loading");
        try {
            await uploadProfilePicture(blob);
            await refreshUser();
            setPfpEditorOpen(false);
            status.setStatus("success", t("success.profileUpdated"));
        } catch {
            status.setStatus("error", t("errors.failedToUploadProfilePicture"));
        }
    }

    async function handlePfpUrl(url: string) {
        status.setStatus("loading");
        try {
            await setProfilePictureUrl(url);
            await refreshUser();
            status.setStatus("success", t("success.profileUpdated"));
        } catch {
            status.setStatus("error", t("errors.failedToSetProfilePictureUrl"));
        }
    }

    async function handleChangeEmail() {
        onRequireSudo(async () => {
            setChangeEmailOpen(true);
        });
    }

    async function handlePfpDelete() {
        status.setStatus("loading");
        try {
            await deleteProfilePicture();
            await refreshUser();
            status.setStatus("success", t("success.profileUpdated"));
        } catch {
            status.setStatus("error", t("errors.failedToDeleteProfilePicture"));
        }
    }

    if (!user) return null;

    return (
        <>
            <Card>
                <h6>{t("profile.heading")}</h6>
                <div className="flex items-center gap-4">
                    <Avatar
                        user={user}
                        size="lg"
                        className="h-16 w-16 cursor-pointer"
                        key={`pfp-nonce-${pfpEditorOpen}`}
                        onClick={() => setPfpEditorOpen(true)}
                    >
                        <AvatarBadge>
                            <IconPencil onClick={() => setPfpEditorOpen(true)} />
                        </AvatarBadge>
                    </Avatar>
                    <div className="space-y-2 w-full">
                        <Label htmlFor="displayName">{t("profile.displayName")}</Label>
                        <Input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setPendingDisplayName(e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">{t("common.email")}</Label>
                    <div className="flex gap-2">
                        <Input id="email" value={user.email} disabled className="flex-1" />
                        {emailEnabled && (
                            <Button variant="outline" onClick={handleChangeEmail}>
                                {t("changeEmail.changeEmail")}
                            </Button>
                        )}
                    </div>
                    {emailEnabled && !user.isEmailVerified && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                            <IconAlertTriangle className="h-4 w-4 shrink-0" />
                            <span>{t("verifyEmail.notVerified")}</span>
                            <Link to={routes.VERIFY_EMAIL} className="underline font-medium">
                                {t("verifyEmail.verifyNow")}
                            </Link>
                        </div>
                    )}
                    {emailEnabled && user.isEmailVerified && (
                        <div className="flex items-center gap-2 text-sm text-primary">
                            <IconCircleCheck className="h-4 w-4 shrink-0" />
                            <span>{t("verifyEmail.verified")}</span>
                        </div>
                    )}
                </div>

                <StatusMessage {...status} />
                
                {
                    isDirty && (
                        <Button onClick={handleProfileSave} disabled={status.loading}>
                            {status.loading ? <Spinner /> : t("profile.saveProfile")}
                        </Button>
                    )
                }


            </Card>

            <ProfilePictureEditor
                open={pfpEditorOpen}
                onClose={() => setPfpEditorOpen(false)}
                onSave={handlePfpUpload}
                onSetUrl={handlePfpUrl}
            />

            {emailEnabled && (
                <ChangeEmailDialog
                    open={changeEmailOpen}
                    onClose={() => setChangeEmailOpen(false)}
                />
            )}
        </>
    );
}
