import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import StatusMessage from "@/components/ui/status-message";
import { sendPasswordResetEmail } from "@/lib/auth-client";
import { getBackendErrorMessage } from "@/lib/backend-error";
import routes from "@/lib/routes";
import useStatusTracker from "@/lib/use-status.tracker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";

export default function ForgotPassword() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const status = useStatusTracker();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        status.setStatus("loading");
        try {
            await sendPasswordResetEmail(email);
            status.clear();
            navigate(`${routes.RESET_PASSWORD}?email=${encodeURIComponent(email)}`);
        } catch (err: unknown) {
            const e = err as { error?: string; errors?: Record<string, string[]> };
            status.setStatus("error", getBackendErrorMessage(e, t("errors.somethingWentWrong")));
        }
    }

    return (
        <div className="flex w-full h-full justify-center items-center flex-col">
            <Card className="w-full max-w-sm p-6 space-y-2 sp-scale-in">
                <h4>{t("forgotPassword.heading")}</h4>
                <p className="text-sm text-muted-foreground">{t("forgotPassword.description")}</p>
                <StatusMessage {...status} />
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">{t("common.email")}</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t("auth.emailPlaceholder")}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={status.loading}>
                        {status.loading ? <Spinner /> : t("forgotPassword.sendCode")}
                    </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground">
                    {t("forgotPassword.rememberPassword")}{" "}
                    <Link to={routes.SIGN_IN} className="underline text-foreground hover:text-foreground/80">
                        {t("common.signIn")}
                    </Link>
                </p>
            </Card>
        </div>
    );
}
