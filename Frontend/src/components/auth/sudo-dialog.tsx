import SecurityCheckpoint from "@/components/auth/security-checkpoint";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import {
    beginPasskeySignIn,
    getSudoMethods,
    verifySudo,
} from "@/lib/auth-client";
import type { SecurityCheckpointMethod } from "@/lib/auth-types";
import { coerceToCredentialRequestOptions, credentialToJSON } from "@/lib/webauthn";
import { useEffect, useEffectEvent, useState } from "react";
import { useTranslation } from "react-i18next";

interface SudoDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function SudoDialog({ open, onClose, onConfirm }: SudoDialogProps) {
    const [methods, setMethods] = useState<SecurityCheckpointMethod[] | null>(null);
    const [selected, setSelected] = useState<SecurityCheckpointMethod | null>(null);
    const [didAutoSelect, setDidAutoSelect] = useState(false);
    const [password, setPassword] = useState("");
    const [totpCode, setTotpCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { t } = useTranslation();

    useEffect(() => {
        if (!open) return;
        setSelected(null);
        setPassword("");
        setTotpCode("");
        setError("");
        setLoading(false);
        setDidAutoSelect(false);
        setMethods(null);
        getSudoMethods()
            .then(setMethods)
            .catch(() => setMethods([]));
    }, [open]);

    const autoSelectSingleMethod = useEffectEvent((availableMethods: SecurityCheckpointMethod[]) => {
        if (availableMethods.length !== 1) return;

        const [method] = availableMethods;
        setDidAutoSelect(true);
        setError("");
        setPassword("");
        setTotpCode("");

        if (method === "passkey") {
            void handlePasskey();
            return;
        }

        setSelected(method);
    });

    useEffect(() => {
        if (!open || !methods || selected !== null || loading || didAutoSelect) return;
        autoSelectSingleMethod(methods);
    }, [didAutoSelect, loading, methods, open, selected]);

    function goBack() {
        setSelected(null);
        setPassword("");
        setTotpCode("");
        setError("");
    }

    async function handlePasswordSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await verifySudo(password);
            onConfirm();
            onClose();
        } catch (err: unknown) {
            const e = err as { error?: string; error_description?: string };
            setError(e?.error_description ?? e?.error ?? t("errors.incorrectPassword"));
        } finally {
            setLoading(false);
        }
    }

    async function handleTotpSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await verifySudo(undefined, totpCode);
            onConfirm();
            onClose();
        } catch (err: unknown) {
            const e = err as { error?: string; error_description?: string };
            setError(e?.error_description ?? e?.error ?? t("errors.invalidCode"));
        } finally {
            setLoading(false);
        }
    }

    async function handlePasskey() {
        setError("");
        setLoading(true);
        try {
            const { options, challengeId } = await beginPasskeySignIn();
            const publicKey = coerceToCredentialRequestOptions(options);
            const credential = await navigator.credentials.get({ publicKey });
            if (!credential) throw { error: t("errors.passkeyAuthCancelled") };
            const assertion = credentialToJSON(credential);
            await verifySudo(undefined, undefined, challengeId, JSON.stringify(assertion));
            onConfirm();
            onClose();
        } catch (err: unknown) {
            const e = err as { error?: string; error_description?: string };
            setError(e?.error_description ?? e?.error ?? t("errors.passkeyVerificationFailed"));
        } finally {
            setLoading(false);
        }
    }

    async function handleSimpleConfirm() {
        setLoading(true);
        try {
            await verifySudo();
            onConfirm();
            onClose();
        } catch (err: unknown) {
            const e = err as { error?: string; error_description?: string };
            setError(e?.error_description ?? e?.error ?? t("errors.verificationFailed"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="sm:max-w-2xl">
                <SecurityCheckpoint
                    methods={methods}
                    selectedMethod={selected}
                    subject={user}
                    error={error}
                    loading={loading}
                    password={password}
                    totpCode={totpCode}
                    onPasswordChange={setPassword}
                    onTotpCodeChange={setTotpCode}
                    onSelectMethod={(method) => {
                        setSelected(method);
                        setError("");
                    }}
                    onBack={goBack}
                    onPasswordSubmit={handlePasswordSubmit}
                    onTotpSubmit={handleTotpSubmit}
                    onPasskey={handlePasskey}
                    onCancel={onClose}
                    onContinueWithoutMethod={handleSimpleConfirm}
                    passwordFieldId="sudo-password"
                    totpFieldId="sudo-totp"
                />
            </DialogContent>
        </Dialog>
    );
}
