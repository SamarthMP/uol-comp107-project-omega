import { useAuth } from "@/hooks/use-auth";
import { confirmChangeEmail, sendChangeEmail } from "@/lib/auth-client";
import { getBackendErrorMessage } from "@/lib/backend-error";
import useStatusTracker from "@/lib/use-status.tracker";
import { useEffect, useEffectEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Spinner } from "../ui/spinner";
import StatusMessage from "../ui/status-message";

interface ChangeEmailDialogProps {
    open: boolean;
    onClose: () => void;
}

export default function ChangeEmailDialog({ open, onClose }: ChangeEmailDialogProps) {
    const { refreshUser } = useAuth();
    const { t } = useTranslation();

    const [newEmail, setNewEmail] = useState("");
    const [code, setCode] = useState("");
    const [codeSent, setCodeSent] = useState(false);
    const status = useStatusTracker();

    function handleClose() {
        setNewEmail("");
        setCode("");
        setCodeSent(false);
        status.clear();
        onClose();
    }

    const handleTimeoutClose = useEffectEvent(() => {
        handleClose();
    });

    async function handleSendCode() {
        status.setStatus("loading");
        try {
            await sendChangeEmail(newEmail);
            setCodeSent(true);
            status.clear();
        } catch (err: unknown) {
            const e = err as { error?: string; errors?: Record<string, string[]> };
            status.setStatus("error", getBackendErrorMessage(e, t("errors.somethingWentWrong")));
        }
    }

    async function handleConfirm() {
        status.setStatus("loading");
        try {
            await confirmChangeEmail(code);
            await refreshUser();
            handleClose();
        } catch (err: unknown) {
            const e = err as { error?: string; errors?: Record<string, string[]> };
            status.setStatus("error", getBackendErrorMessage(e, t("errors.somethingWentWrong")));
        }
    }

    // Timeout the dialog after 10 minutes and auto close
    useEffect(() => {
        if (!open) return;
        const timeout = setTimeout(() => {
            if (open) handleTimeoutClose();
        }, 10 * 60 * 1000);
        return () => clearTimeout(timeout);
    }, [open]);


    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("changeEmail.dialogTitle")}</DialogTitle>
                    <DialogDescription>
                        {codeSent
                            ? t("changeEmail.codeSentTo", { email: newEmail })
                            : t("changeEmail.description")}
                    </DialogDescription>
                </DialogHeader>

                <StatusMessage {...status} />

                {!codeSent ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newEmail">{t("changeEmail.newEmail")}</Label>
                            <Input
                                id="newEmail"
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder={t("auth.emailPlaceholder")}
                                autoComplete="email"
                            />
                        </div>
                        <Button onClick={handleSendCode} disabled={status.loading || !newEmail} className="w-full">
                            {status.loading ? <Spinner /> : t("changeEmail.sendCode")}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">{t("changeEmail.code")}</Label>
                            <Input
                                id="code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder={t("changeEmail.codePlaceholder")}
                                maxLength={6}
                                autoComplete="one-time-code"
                            />
                        </div>
                        <Button onClick={handleConfirm} disabled={status.loading || !code} className="w-full">
                            {status.loading ? <Spinner /> : t("changeEmail.confirm")}
                        </Button>
                        <Button variant="ghost" className="w-full" onClick={handleSendCode} disabled={status.loading}>
                            {t("changeEmail.resendCode")}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
