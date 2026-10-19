import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import StatusMessage from "@/components/ui/status-message";
import { useAuth } from "@/hooks/use-auth";
import { useAuthConfig } from "@/hooks/use-email-feature";
import {
    beginPasskeySignIn,
    clearPendingTwoFactor,
    completePasskeySignIn,
    exchangeExternalCode,
    getExternalChallengeUrl,
    signIn,
    storePendingTwoFactor,
} from "@/lib/auth-client";
import type { ErrorResponse, TwoFactorRequiredResponse } from "@/lib/auth-types";
import routes from "@/lib/routes";
import useStatusTracker from "@/lib/use-status.tracker";
import { coerceToCredentialRequestOptions, credentialToJSON } from "@/lib/webauthn";
import { IconShieldLock } from "@tabler/icons-react";
import { useEffect, useEffectEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router";

export default function SignIn() {
    const navigate = useNavigate();
    const { refreshUser, user } = useAuth();
    const [searchParams] = useSearchParams();
    const { t } = useTranslation();
    const { emailEnabled, providers } = useAuthConfig();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    const status = useStatusTracker();

    useEffect(() => {
        if (user) {
            navigate(routes.MAIN);
        }
    }, [user, navigate]);

    const handleExternalCallback = useEffectEvent((code: string) => {
        status.setStatus("loading");
        exchangeExternalCode(code)
            .then(async () => {
                await refreshUser();
                navigate(routes.MAIN);
            })
            .catch((err: unknown) => {
                const e = err as ErrorResponse;
                status.setStatus("error", e?.error_description ?? e?.error ?? t("errors.externalSignInFailed"));
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
            await signIn(email, password);
            clearPendingTwoFactor();
            await refreshUser();
            navigate(routes.MAIN);
        } catch (err: unknown) {
            const e = err as TwoFactorRequiredResponse;
            if (e?.error === "2fa_required") {
                if (!e.twoFactorId || !e.methods?.length) {
                    status.setStatus("error", e?.error_description ?? t("errors.unableToStart2fa"));
                    return;
                }

                storePendingTwoFactor({
                    twoFactorId: e.twoFactorId,
                    methods: e.methods,
                    displayName: e.displayName ?? email,
                    profilePictureUrl: e.profilePictureUrl ?? null,
                    email,
                });
                status.clear();
                navigate(routes.TWO_FACTOR);
            } else {
                status.setStatus("error", e?.error_description ?? e?.error ?? t("errors.signInFailed"));
            }
        }
    }

    async function handlePasskeySignIn() {
        status.setStatus("loading");
        try {
            const { options, challengeId } = await beginPasskeySignIn();
            const publicKey = coerceToCredentialRequestOptions(options);
            const credential = await navigator.credentials.get({ publicKey });
            if (!credential) throw { error: t("errors.passkeyAuthCancelled") };
            await completePasskeySignIn(challengeId, credentialToJSON(credential));
            clearPendingTwoFactor();
            await refreshUser();
            navigate(routes.MAIN);
        } catch (err: unknown) {
            const e = err as ErrorResponse;
            status.setStatus("error", e?.error_description ?? e?.error ?? t("errors.passkeySignInFailed"));
        }
    }

    return (
        <div className="flex w-full h-full justify-center items-center flex-col">
            <Card className="w-full max-w-sm p-6 space-y-2 sp-scale-in">
                <h4>{t("auth.signInHeading")}</h4>
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
                            autoComplete="current-password"
                        />
                        {emailEnabled && (
                            <Link to={routes.FORGOT_PASSWORD} className="text-xs text-muted-foreground hover:text-foreground underline float-right">
                                {t("auth.forgotPassword")}
                            </Link>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={status.loading}>
                        {status.loading ? <Spinner /> : t("common.signIn")}
                    </Button>
                </form>


                <div className="space-y-2">      
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">{t("common.or")}</span>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handlePasskeySignIn}
                        disabled={status.loading}
                    >
                        <IconShieldLock/>
                        {t("auth.usePasskey")}
                    </Button>

                    {providers.length > 0 && (
                        <>
                            {providers.map((p) => (
                                <Button
                                    key={p.id}
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    disabled={status.loading}
                                    style={{ backgroundColor: p.accentColor || "transparent", color: p.textColor || "inherit", opacity: status.loading ? 0.6 : 1 }}
                                    asChild
                                >
                                    <a href={getExternalChallengeUrl(p.id, window.location.pathname)}>
                                        {p.iconURL && (
                                            <img src={p.iconURL} alt="" className="h-4 w-4 mr-1" />
                                        )}
                                        {t("auth.signInWith", { provider: p.displayName })}
                                    </a>
                                </Button>
                            ))}
                        </>
                    )}
                </div>

                <p className="text-center text-sm text-muted-foreground">
                    {t("auth.dontHaveAccount")}{" "}
                    <Link to={routes.SIGN_UP} className="underline text-foreground hover:text-foreground/80">
                        {t("common.signUp")}
                    </Link>
                </p>
            </Card>
        </div>
    );
}
