import type { ReturnLocationState } from "@/components/auth/require-auth";
import AppLogo from "@/components/brand/app-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import StatusMessage from "@/components/ui/status-message";
import { useAuth } from "@/hooks/use-auth";
import { isRedirectingToSignIn, startDemoSession } from "@/lib/auth-client";
import type { ErrorResponse } from "@/lib/auth-types";
import { getBackendErrorMessage } from "@/lib/backend-error";
import routes from "@/lib/routes";
import useStatusTracker from "@/lib/use-status.tracker";
import { IconRefresh } from "@tabler/icons-react";
import { useEffect, useEffectEvent, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";

// Signs visitors straight in with a fresh passwordless "Demo User NNNN" account for this browser session
export default function DemoSession() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading, refreshUser } = useAuth();
    const status = useStatusTracker("loading");
    const hasStarted = useRef(false);

    const returnTo = (location.state as ReturnLocationState | null)?.from ?? routes.MAIN;

    async function beginSession() {
        status.setStatus("loading");
        try {
            await startDemoSession();
            await refreshUser();
        } catch (err: unknown) {
            status.setStatus("error", getBackendErrorMessage(err as ErrorResponse, t("demoSession.failed")));
        }
    }

    const startOnce = useEffectEvent(() => {
        if (hasStarted.current || isRedirectingToSignIn()) return;
        hasStarted.current = true;
        void beginSession();
    });

    useEffect(() => {
        // Wait for any existing session to be restored before deciding to create a new one
        if (loading) return;

        if (user) {
            navigate(returnTo, { replace: true });
            return;
        }

        startOnce();
    }, [loading, navigate, returnTo, user]);

    return (
        <main className="flex h-full w-full items-center justify-center bg-background p-4">
            <Card className="w-full max-w-sm items-center gap-5 px-6 py-8 text-center sp-scale-in">
                <AppLogo className="size-14" />
                <div className="space-y-1.5">
                    <h1 className="text-2xl leading-tight">{t("brand.fullName")}</h1>
                    <p className="text-muted-foreground">{t("demoSession.description")}</p>
                </div>

                {status.status === "error" ? (
                    <div className="w-full space-y-3 text-left">
                        <StatusMessage {...status} title={t("demoSession.failedTitle")} />
                        <Button className="w-full" onClick={() => void beginSession()}>
                            <IconRefresh />
                            {t("demoSession.retry")}
                        </Button>
                    </div>
                ) : (
                    <p role="status" className="flex items-center gap-2 font-medium">
                        <Spinner className="size-5 text-primary" />
                        {t("demoSession.settingUp")}
                    </p>
                )}
            </Card>
        </main>
    );
}
