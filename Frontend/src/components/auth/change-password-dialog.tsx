import { useAuth } from "@/hooks/use-auth";
import { changePassword, setPassword } from "@/lib/auth-client";
import { getBackendErrorMessage } from "@/lib/backend-error";
import useStatusTracker from "@/lib/use-status.tracker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import StatusMessage from "../ui/status-message";

interface ChangePasswordDialogProps {
    open: boolean;
    onClose: () => void;
}

export default function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
    const { user, refreshUser } = useAuth();
    const { t } = useTranslation();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const passwordStatus = useStatusTracker();
    

    async function handleChangePassword() {
        passwordStatus.setStatus("loading");
        try {
            if (user?.hasPassword) {
                await changePassword(currentPassword, newPassword);
            } else {
                await setPassword(newPassword);
            }
            await refreshUser();
                
            setCurrentPassword("");
            setNewPassword("");
            passwordStatus.clear();
            onClose();
        } catch (err: unknown) {
            const e = err as { error?: string; errors?: Record<string, string[]> };
            passwordStatus.setStatus("error", getBackendErrorMessage(e, t("errors.failedToChangePassword")));
        }
    }

    if (!user) return;

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t("changePassword.dialogTitle")}</DialogTitle>
                    <DialogDescription>

                    </DialogDescription>
                </DialogHeader>
                {/* Password - adapts based on whether user has a password set */}
                {user.hasPassword && (
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">{t("changePassword.currentPassword")}</Label>
                        <Input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="newPassword">
                        {user.hasPassword ? t("changePassword.newPassword") : t("changePassword.setAPassword")}
                    </Label>
                    <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                    {!user.hasPassword && (
                        <p className="text-xs text-muted-foreground">
                            {t("changePassword.externalAccountHint")}
                        </p>
                    )}
                </div>
                    
                

                <StatusMessage {...passwordStatus} />

                <Button
                    onClick={handleChangePassword}
                    disabled={
                        passwordStatus.loading ||
                    !newPassword ||
                    (user.hasPassword && !currentPassword)
                    }
                >
                    {user.hasPassword ? t("changePassword.changePassword") : t("changePassword.setPassword")}
                </Button>
            </DialogContent>
        </Dialog>
    );
}