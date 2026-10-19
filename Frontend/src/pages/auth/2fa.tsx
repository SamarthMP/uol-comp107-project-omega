import SecurityCheckpoint from "@/components/auth/security-checkpoint";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
    beginTwoFactorPasskey,
    clearPendingTwoFactor,
    completeTwoFactor,
    getPendingTwoFactor,
} from "@/lib/auth-client";
import type { ErrorResponse, PendingTwoFactorSession, SecurityCheckpointMethod } from "@/lib/auth-types";
import routes from "@/lib/routes";
import { coerceToCredentialRequestOptions, credentialToJSON } from "@/lib/webauthn";
import { useEffect, useEffectEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

export default function TwoFactor() {
    const navigate = useNavigate();
    const { refreshUser, user } = useAuth();
    const { t } = useTranslation();

    const [checkpoint, setCheckpoint] = useState<PendingTwoFactorSession | null>(() => getPendingTwoFactor());
    const [selectedMethod, setSelectedMethod] = useState<SecurityCheckpointMethod | null>(null);
    const [didAutoSelect, setDidAutoSelect] = useState(false);
    const [totpCode, setTotpCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            clearPendingTwoFactor();
            navigate(routes.MAIN, { replace: true });
            return;
        }

        if (!checkpoint) {
            navigate(routes.SIGN_IN, { replace: true });
        }
    }, [checkpoint, navigate, user]);

    useEffect(() => {
        setDidAutoSelect(false);
    }, [checkpoint?.twoFactorId]);

    const autoSelectSingleMethod = useEffectEvent((availableMethods: SecurityCheckpointMethod[]) => {
        if (availableMethods.length !== 1) return;

        const [method] = availableMethods;
        setDidAutoSelect(true);
        setError("");
        setTotpCode("");

        if (method === "passkey") {
            void handlePasskey();
            return;
        }

        setSelectedMethod(method);
    });

    useEffect(() => {
        if (!checkpoint || selectedMethod !== null || loading || didAutoSelect) return;
        autoSelectSingleMethod(checkpoint.methods);
    }, [checkpoint, didAutoSelect, loading, selectedMethod]);

    function goBackToSelection() {
        setSelectedMethod(null);
        setTotpCode("");
        setError("");
    }

    function cancelTwoFactor() {
        clearPendingTwoFactor();
        setCheckpoint(null);
        navigate(routes.SIGN_IN, { replace: true });
    }

    async function handleTotpSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!checkpoint) return;

        setError("");
        setLoading(true);
        try {
            await completeTwoFactor(checkpoint.twoFactorId, totpCode);
            clearPendingTwoFactor();
            await refreshUser();
            navigate(routes.MAIN);
        } catch (err: unknown) {
            const e = err as ErrorResponse;
            setError(e?.error_description ?? e?.error ?? t("errors.invalidCode"));
        } finally {
            setLoading(false);
        }
    }

    async function handlePasskey() {
        if (!checkpoint) return;

        setError("");
        setLoading(true);
        try {
            const { options, challengeId } = await beginTwoFactorPasskey(checkpoint.twoFactorId);
            const publicKey = coerceToCredentialRequestOptions(options);
            const credential = await navigator.credentials.get({ publicKey });
            if (!credential) throw { error: t("errors.passkeyAuthCancelled") };

            const assertion = credentialToJSON(credential);
            await completeTwoFactor(checkpoint.twoFactorId, undefined, challengeId, JSON.stringify(assertion));
            clearPendingTwoFactor();
            await refreshUser();
            navigate(routes.MAIN);
        } catch (err: unknown) {
            const e = err as ErrorResponse;
            setError(e?.error_description ?? e?.error ?? t("errors.passkeyVerificationFailed"));
        } finally {
            setLoading(false);
        }
    }

    if (!checkpoint) {
        return null;
    }

    return (
        <div className="flex h-full w-full flex-col items-center justify-center">
            <Card className="w-full max-w-2xl p-6 sp-scale-in">
                <SecurityCheckpoint
                    methods={checkpoint.methods}
                    selectedMethod={selectedMethod}
                    subject={checkpoint}
                    error={error}
                    loading={loading}
                    password=""
                    totpCode={totpCode}
                    onPasswordChange={() => {}}
                    onTotpCodeChange={setTotpCode}
                    onSelectMethod={(method) => {
                        setSelectedMethod(method);
                        setError("");
                    }}
                    onBack={goBackToSelection}
                    onPasswordSubmit={() => undefined}
                    onTotpSubmit={handleTotpSubmit}
                    onPasskey={handlePasskey}
                    onCancel={cancelTwoFactor}
                    showSelectionCancel
                    totpFieldId="two-factor-totp"
                />
            </Card>
        </div>
    );
}