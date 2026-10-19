import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import {
    beginPasskeyRegister,
    completePasskeyRegister,
    deletePasskey,
    listPasskeys,
} from "@/lib/auth-client";
import type { PasskeyInfo } from "@/lib/auth-types";
import useStatusTracker from "@/lib/use-status.tracker";
import { coerceToCredentialCreationOptions, credentialToJSON } from "@/lib/webauthn";
import { IconTrash } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import StatusMessage from "../ui/status-message";

interface PasskeysSectionProps {
    onRequireSudo: (action: () => void) => void;
}

export default function PasskeysSection({ onRequireSudo }: PasskeysSectionProps) {
    const { refreshUser } = useAuth();
    const { t } = useTranslation();

    const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
    const [passkeyName, setPasskeyName] = useState("");

    const status = useStatusTracker();

    const refreshPasskeys = useCallback(async () => {
        try {
            setPasskeys(await listPasskeys());
        } catch {
            // Failed to load passkeys, leave the list empty
        }
    }, []);

    useEffect(() => {
        refreshPasskeys();
    }, [refreshPasskeys]);

    async function handlePasskeyRegister() {
        if (!passkeyName.trim()) return;
        status.setStatus("loading");
        try {
            const { options, challengeId } = await beginPasskeyRegister();
            const publicKey = coerceToCredentialCreationOptions(options);
            const credential = await navigator.credentials.create({ publicKey });
            if (!credential) throw new Error("Registration cancelled");
            await completePasskeyRegister(challengeId, passkeyName.trim(), credentialToJSON(credential));
            setPasskeyName("");
            await refreshPasskeys();
            await refreshUser();
            status.setStatus("success", t("success.passkeyRegistered"));
        } catch {
            status.setStatus("error", t("errors.failedToRegisterPasskey"));
        }
    }

    function handlePasskeyDelete(id: string) {
        onRequireSudo(async () => {
            status.setStatus("loading");
            try {
                await deletePasskey(id, "");
                await refreshPasskeys();
                await refreshUser();
            } catch (err: unknown) {
                const e = err as { error?: string };
                status.setStatus("error", e?.error ?? t("errors.failedToDeletePasskey"));
            }
        });
    }

    return (
        <Card>
            <h6>{t("passkeys.heading")}</h6>
            <p className="text-sm text-muted-foreground">
                {t("passkeys.description")}
            </p>

            {passkeys.length > 0 && (
                <div className="space-y-2">
                    {passkeys.map((pk) => (
                        <div
                            key={pk.id}
                            className="flex items-center justify-between border rounded-lg px-4 py-3"
                        >
                            <div>
                                <p className="font-medium">{pk.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {t("passkeys.added", { date: new Date(pk.createdAt).toLocaleDateString() })}
                                </p>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlePasskeyDelete(pk.id)}
                                disabled={status.loading}
                            >
                                <IconTrash />
                                {t("common.remove")}
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                    <Label htmlFor="passkeyName">{t("passkeys.passkeyName")}</Label>
                    <Input
                        id="passkeyName"
                        value={passkeyName}
                        onChange={(e) => setPasskeyName(e.target.value)}
                        placeholder={t("passkeys.passkeyNamePlaceholder")}
                    />
                </div>
                <Button
                    onClick={handlePasskeyRegister}
                    disabled={status.loading || !passkeyName.trim()}
                >
                    {t("common.register")}
                </Button>
            </div>
            
            <StatusMessage {...status} />
        </Card>
    );
}
