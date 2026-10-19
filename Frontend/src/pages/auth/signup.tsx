import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import StatusMessage from "@/components/ui/status-message";
import { useAuth } from "@/hooks/use-auth";
import { useAuthConfig } from "@/hooks/use-email-feature";
import {
    exchangeExternalCode,
    getExternalChallengeUrl,
    signUp,
} from "@/lib/auth-client";
import type { ErrorResponse } from "@/lib/auth-types";
import { getBackendErrorMessage } from "@/lib/backend-error";
import routes from "@/lib/routes";
import useStatusTracker from "@/lib/use-status.tracker";
import { useEffect, useEffectEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router";

export default function SignUp() {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();
    const [searchParams] = useSearchParams();
    const { t } = useTranslation();
    const { providers } = useAuthConfig();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const status = useStatusTracker();

    const handleExternalCallback = useEffectEvent((code: string) => {
        status.setStatus("loading");
        exchangeExternalCode(code)
            .then(async () => {
                await refreshUser();
                navigate(routes.MAIN);
            })
            .catch((err: unknown) => {
                const e = err as ErrorResponse;
                status.setStatus("error", getBackendErrorMessage(e, t("errors.externalSignUpFailed")));
            });
    });

    // Handle external OAuth callback code
    useEffect(() => {
        const code = searchParams.get("code");
        if (!code) return;
        handleExternalCallback(code);
    }, [searchParams]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        status.setStatus("loading");
        try {
            await signUp(email, password, email || undefined);
            await refreshUser();
            navigate(routes.MAIN);
        } catch (err: unknown) {
            const e = err as { error?: string; error_description?: string; errors?: Record<string, string[]> };
            status.setStatus("error", getBackendErrorMessage(e, t("errors.signUpFailed")));
        }
    }

    return (
        <div className="flex w-full h-full justify-center items-center flex-col">
            <Card className="w-full max-w-sm p-6 space-y-2 sp-scale-in">
                <h4>{t("auth.signUpHeading")}</h4>
                
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
                    <div className="space-y-2">
                        <Label htmlFor="password">{t("common.password")}</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={status.loading}>
                        {status.loading ? <Spinner className="mx-auto" /> : t("common.signUp")}
                    </Button>

                    {providers.length > 0 && (
                        <>
                            <div className="relative mb-6 mt-2">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">{t("common.or")}</span>
                                </div>
                            </div>
                            {providers.map((p) => (
                                <Button
                                    key={p.id}
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    style={{ backgroundColor: p.accentColor || "transparent", color: p.textColor || "inherit" }}
                                    asChild
                                >
                                    <a href={getExternalChallengeUrl(p.id, window.location.pathname)}>
                                        {p.iconURL && (
                                            <img src={p.iconURL} alt="" className="h-4 w-4 mr-1" />
                                        )}
                                        {t("auth.signUpWith", { provider: p.displayName })}
                                    </a>
                                </Button>
                            ))}
                        </>
                    )}
                </form>
                <p className="text-center text-sm text-muted-foreground">
                    {t("auth.alreadyHaveAccount")}{" "}
                    <Link to={routes.SIGN_IN} className="underline text-foreground hover:text-foreground/80">
                        {t("common.signIn")}
                    </Link>
                </p>
            </Card>
        </div>
    );
}
