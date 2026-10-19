import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import {
    disableTotp,
    setupTotp,
    verifyTotp
} from "@/lib/auth-client";
import type { TotpSetupResponse } from "@/lib/auth-types";
import useStatusTracker from "@/lib/use-status.tracker";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import ChangePasswordDialog from "../auth/change-password-dialog";
import StatusMessage from "../ui/status-message";

interface SecuritySectionProps {
    onRequireSudo: (action: () => void) => void;
}

export default function SecuritySection({ onRequireSudo }: SecuritySectionProps) {
    const { user, refreshUser } = useAuth();
    const { t } = useTranslation();


    const [totpSetupState, setTotpSetupState] = useState<TotpSetupResponse | null>(null);
    const [totpCode, setTotpCode] = useState("");
    const totpStatus = useStatusTracker();

    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);


    async function handleTotpSetup() {
        totpStatus.setStatus("loading");
        try {
            const setup = await setupTotp();
            setTotpSetupState(setup);
            totpStatus.clear();
        } catch {
            totpStatus.setStatus("error", t("errors.failedToStartTotpSetup"));
        }
    }

    async function handleTotpVerify() {
        totpStatus.setStatus("loading");

        try {
            await verifyTotp(totpCode);
            await refreshUser();
            setTotpSetupState(null);
            setTotpCode("");
            totpStatus.setStatus("success", t("success.totpEnabled"));
        } catch {
            totpStatus.setStatus("error", t("errors.invalidCodeTryAgain"));
        }
    }

    function handleTotpDisable() {
        onRequireSudo(async () => {
            totpStatus.setStatus("loading");
            try {
                await disableTotp("");
                await refreshUser();
                totpStatus.setStatus("success", t("success.totpDisabled"));
            } catch (err: unknown) {
                const e = err as { error?: string };
                totpStatus.setStatus("error", e?.error ?? t("errors.failedToDisable2fa"));
            }
        });
    }

    if (!user) return null;

    return (
        <Card>
            <h6>{t("security.heading")}</h6>

            {/* Password Section */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-medium">{t("security.passwordLabel")}</p>
                    <p className="text-sm text-muted-foreground">
                        {user.hasPassword ? t("security.passwordHidden") : t("security.passwordNotSet")}
                    </p>
                </div>
                <Button onClick={() => setPasswordDialogOpen(true)}>
                    {user.hasPassword ? t("security.changePassword") : t("security.setPassword")}
                </Button>
                <ChangePasswordDialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} />
            </div>

            <Separator />

            {/* TOTP 2FA */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-medium">{t("security.twoFactorAuth")}</p>
                    <p className="text-sm text-muted-foreground">
                        {t("security.twoFactorDescription")}
                    </p>
                </div>
                <Button variant={!user.isTotpEnabled ? "default" : "destructive"} onClick={!user.isTotpEnabled ? handleTotpSetup : handleTotpDisable} disabled={totpStatus.loading || !!totpSetupState}>
                    {(!user.isTotpEnabled) ? t("security.setup2fa") : t("security.disable2fa")}
                </Button>
            </div>

            {totpSetupState && (
                <div className="space-y-4 border rounded-lg p-4">
                    <p className="text-sm">{t("security.scanQrCode")}</p>
                    <div className="flex justify-center">
                        <QRCodeSVG value={totpSetupState.authenticatorUri} size={192} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{t("security.manualKey")}</p>
                        <code className="text-sm bg-muted px-2 py-1 rounded block text-center break-all select-all">
                            {totpSetupState.sharedKey}
                        </code>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="totpVerify">{t("security.verificationCode")}</Label>
                        <Input
                            id="totpVerify"
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value)}
                            placeholder={t("security.verificationCodePlaceholder")}
                            maxLength={6}
                            autoComplete="one-time-code"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleTotpVerify} disabled={totpStatus.loading || !totpCode}>
                            {t("security.enable2fa")}
                        </Button>
                        <Button variant="ghost" onClick={() => { setTotpSetupState(null); setTotpCode(""); }}>
                            {t("common.cancel")}
                        </Button>
                    </div>
                </div>
            )}


            <StatusMessage {...totpStatus} />
        </Card>
    );
}
