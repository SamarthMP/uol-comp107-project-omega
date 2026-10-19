import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import StatusMessage from "@/components/ui/status-message";
import { useAuth } from "@/hooks/use-auth";
import { confirmEmailVerification, sendVerificationEmail } from "@/lib/auth-client";
import { getBackendErrorMessage } from "@/lib/backend-error";
import routes from "@/lib/routes";
import useStatusTracker from "@/lib/use-status.tracker";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

export default function VerifyEmail() {
    const { t } = useTranslation();
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [code, setCode] = useState("");
    const [sent, setSent] = useState(false);
    const status = useStatusTracker();
    const resendStatus = useStatusTracker();

    useEffect(() => {
        if (user?.isEmailVerified) {
            navigate(routes.MAIN);
        }
    }, [user, navigate]);

    async function handleSend() {
        status.setStatus("loading");
        try {
            await sendVerificationEmail();
            setSent(true);
            status.clear();
        } catch (err: unknown) {
            const e = err as { error?: string; errors?: Record<string, string[]> };
            status.setStatus("error", getBackendErrorMessage(e, t("errors.somethingWentWrong")));
        }
    }

    async function handleResend() {
        resendStatus.setStatus("loading");
        try {
            await sendVerificationEmail();
            resendStatus.setStatus("success", t("verifyEmail.codeSent"));
        } catch {
            resendStatus.setStatus("error", t("errors.somethingWentWrong"));
        }
    }

    async function handleConfirm(e: React.FormEvent) {
        e.preventDefault();
        status.setStatus("loading");
        try {
            await confirmEmailVerification(code);
            await refreshUser();
            navigate(routes.MAIN);
        } catch (err: unknown) {
            const e = err as { error?: string; errors?: Record<string, string[]> };
            status.setStatus("error", getBackendErrorMessage(e, t("errors.somethingWentWrong")));
        }
    }

    if (!user) return null;

    return (
        <div className="flex w-full h-full justify-center items-center flex-col">
            <Card className="w-full max-w-sm p-6 space-y-2 sp-scale-in">
                <h4>{t("verifyEmail.heading")}</h4>
                <p className="text-sm text-muted-foreground">
                    {sent
                        ? t("verifyEmail.codeSentTo", { email: user.email })
                        : t("verifyEmail.description")}
                </p>
                <StatusMessage {...status} />
                <StatusMessage {...resendStatus} />

                {!sent ? (
                    <Button className="w-full" onClick={handleSend} disabled={status.loading}>
                        {status.loading ? <Spinner /> : t("verifyEmail.sendCode")}
                    </Button>
                ) : (
                    <>
                        <form onSubmit={handleConfirm} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">{t("verifyEmail.code")}</Label>
                                <Input
                                    id="code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder={t("verifyEmail.codePlaceholder")}
                                    maxLength={6}
                                    required
                                    autoComplete="one-time-code"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={status.loading || !code}>
                                {status.loading ? <Spinner /> : t("verifyEmail.verify")}
                            </Button>
                        </form>
                        <Button variant="ghost" className="w-full" onClick={handleResend} disabled={resendStatus.loading}>
                            {resendStatus.loading ? <Spinner /> : t("verifyEmail.resendCode")}
                        </Button>
                    </>
                )}
            </Card>
        </div>
    );
}
