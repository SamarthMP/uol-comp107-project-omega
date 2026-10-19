import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import StatusMessage from "@/components/ui/status-message";
import { confirmPasswordReset, sendPasswordResetEmail } from "@/lib/auth-client";
import { getBackendErrorMessage } from "@/lib/backend-error";
import routes from "@/lib/routes";
import useStatusTracker from "@/lib/use-status.tracker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";

export default function ResetPassword() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();

    const [email] = useState(searchParams.get("email") ?? "");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [success, setSuccess] = useState(false);
    const status = useStatusTracker();
    const resendStatus = useStatusTracker();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        status.setStatus("loading");
        try {
            await confirmPasswordReset(email, code, newPassword);
            setSuccess(true);
            status.clear();
        } catch (err: unknown) {
            const e = err as { error?: string; errors?: Record<string, string[]> };
            status.setStatus("error", getBackendErrorMessage(e, t("errors.somethingWentWrong")));
        }
    }

    async function handleResend() {
        resendStatus.setStatus("loading");
        try {
            await sendPasswordResetEmail(email);
            resendStatus.setStatus("success", t("forgotPassword.codeSent"));
        } catch {
            resendStatus.setStatus("error", t("errors.somethingWentWrong"));
        }
    }

    if (success) {
        return (
            <div className="flex w-full h-full justify-center items-center flex-col">
                <Card className="w-full max-w-sm p-6 space-y-4 sp-scale-in text-center">
                    <h4>{t("resetPassword.successHeading")}</h4>
                    <p className="text-sm text-muted-foreground">{t("resetPassword.successDescription")}</p>
                    <Button asChild className="w-full">
                        <Link to={routes.SIGN_IN}>{t("common.signIn")}</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex w-full h-full justify-center items-center flex-col">
            <Card className="w-full max-w-sm p-6 space-y-2 sp-scale-in">
                <h4>{t("resetPassword.heading")}</h4>
                <p className="text-sm text-muted-foreground">{t("resetPassword.description")}</p>
                <StatusMessage {...status} />
                <StatusMessage {...resendStatus} />
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">{t("common.email")}</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            disabled
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="code">{t("resetPassword.code")}</Label>
                        <Input
                            id="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder={t("resetPassword.codePlaceholder")}
                            maxLength={6}
                            required
                            autoComplete="one-time-code"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">{t("resetPassword.newPassword")}</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={status.loading || !code || !newPassword}>
                        {status.loading ? <Spinner /> : t("resetPassword.resetPassword")}
                    </Button>
                </form>
                <Button variant="ghost" className="w-full" onClick={handleResend} disabled={resendStatus.loading}>
                    {resendStatus.loading ? <Spinner /> : t("resetPassword.resendCode")}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                    <Link to={routes.SIGN_IN} className="underline text-foreground hover:text-foreground/80">
                        {t("common.back")}
                    </Link>
                </p>
            </Card>
        </div>
    );
}
