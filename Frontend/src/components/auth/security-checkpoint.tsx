import { Avatar, AvatarBadge } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import StatusMessage from "@/components/ui/status-message";
import type { SecurityCheckpointIdentity, SecurityCheckpointMethod } from "@/lib/auth-types";
import {
    IconArrowLeft,
    IconFingerprint,
    IconKey,
    IconShieldLock,
    IconShieldLockFilled,
} from "@tabler/icons-react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

interface SecurityCheckpointProps {
    methods: SecurityCheckpointMethod[] | null;
    selectedMethod: SecurityCheckpointMethod | null;
    subject?: SecurityCheckpointIdentity | null;
    error?: string;
    loading?: boolean;
    password: string;
    totpCode: string;
    onPasswordChange: (value: string) => void;
    onTotpCodeChange: (value: string) => void;
    onSelectMethod: (method: SecurityCheckpointMethod) => void;
    onBack: () => void;
    onPasswordSubmit: (event: FormEvent) => void;
    onTotpSubmit: (event: FormEvent) => void;
    onPasskey: () => void;
    onCancel?: () => void;
    onContinueWithoutMethod?: () => void;
    confirmLabel?: string;
    showSelectionCancel?: boolean;
    passwordFieldId?: string;
    totpFieldId?: string;
}

const MethodOrder: SecurityCheckpointMethod[] = ["password", "totp", "passkey"];

export default function SecurityCheckpoint({
    methods,
    selectedMethod,
    subject,
    error,
    loading = false,
    password,
    totpCode,
    onPasswordChange,
    onTotpCodeChange,
    onSelectMethod,
    onBack,
    onPasswordSubmit,
    onTotpSubmit,
    onPasskey,
    onCancel,
    onContinueWithoutMethod,
    confirmLabel = "Confirm",
    showSelectionCancel = false,
    passwordFieldId = "security-checkpoint-password",
    totpFieldId = "security-checkpoint-totp",
}: SecurityCheckpointProps) {
    const hasAnyMethod = (methods?.length ?? 0) > 0;
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div>
                    <h4 className="text-xl -mb-1 font-semibold">{t("securityCheckpoint.heading")}</h4>
                    <p className="text-xs/relaxed mb-2 text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground">{t("securityCheckpoint.description")}</p>
                </div>
                <StatusMessage error={error} />
            </div>

            <div className="flex items-center justify-between gap-6">
                {hasAnyMethod && subject && (
                    <div className="m-6 hidden lg:flex">
                        <Avatar user={subject} className="h-40 w-40">
                            <AvatarBadge className="size-12! bg-transparent ring-0">
                                <IconShieldLockFilled
                                    style={{ paintOrder: "stroke" }}
                                    className="size-12! stroke-4 stroke-background"
                                    color="var(--secondary)"
                                />
                            </AvatarBadge>
                        </Avatar>
                    </div>
                )}

                <div className="flex w-full flex-col">
                    {!methods ? (
                        <Spinner className="mx-auto" />
                    ) : !hasAnyMethod ? (
                        <div className="flex h-full w-full items-end justify-end gap-2">
                            {onCancel && (
                                <Button variant="ghost" onClick={onCancel}>
                                    {t("common.cancel")}
                                </Button>
                            )}
                            {onContinueWithoutMethod && (
                                <Button onClick={onContinueWithoutMethod} disabled={loading}>
                                    {loading ? <Spinner /> : t("common.continue")}
                                </Button>
                            )}
                        </div>
                    ) : selectedMethod === null ? (
                        <div className="flex h-full w-full flex-col justify-center space-y-2 lg:p-6 sp-slide-in">
                            {MethodOrder.filter((method) => methods.includes(method)).map((method) => {
                                if (method === "password") {
                                    return (
                                        <Button
                                            key={method}
                                            variant="outline"
                                            className="h-12 w-full justify-start gap-2 px-4"
                                            onClick={() => onSelectMethod(method)}
                                            disabled={loading}
                                        >
                                            <IconKey color="var(--secondary)" className="h-5! w-5!" />
                                            {t("securityCheckpoint.enterPassword")}
                                        </Button>
                                    );
                                }

                                if (method === "totp") {
                                    return (
                                        <Button
                                            key={method}
                                            variant="outline"
                                            className="h-12 w-full justify-start gap-2 px-4"
                                            onClick={() => onSelectMethod(method)}
                                            disabled={loading}
                                        >
                                            <IconShieldLock color="var(--secondary)" className="h-5! w-5!" />
                                            {t("securityCheckpoint.useAuthenticatorApp")}
                                        </Button>
                                    );
                                }

                                return (
                                    <Button
                                        key={method}
                                        variant="outline"
                                        className="h-12 w-full justify-start gap-2 px-4"
                                        onClick={onPasskey}
                                        disabled={loading}
                                    >
                                        <IconFingerprint color="var(--secondary)" className="h-5! w-5!" />
                                        {loading ? <Spinner /> : t("securityCheckpoint.usePasskey")}
                                    </Button>
                                );
                            })}

                            {showSelectionCancel && onCancel && (
                                <Button variant="ghost" onClick={onCancel} className="mt-2 self-end">
                                    <IconArrowLeft/>
                                    {t("common.cancel")}
                                </Button>
                            )}
                        </div>
                    ) : selectedMethod === "password" ? (
                        <form onSubmit={onPasswordSubmit} className="flex h-full flex-col justify-center gap-4 sp-slide-in">
                            <div className="space-y-2">
                                <Label htmlFor={passwordFieldId}>{t("common.password")}</Label>
                                <Input
                                    id={passwordFieldId}
                                    type="password"
                                    value={password}
                                    onChange={(event) => onPasswordChange(event.target.value)}
                                    autoFocus
                                    autoComplete="current-password"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" onClick={onBack}>
                                    <IconArrowLeft className="mr-1 h-4 w-4" />
                                    {t("common.back")}
                                </Button>
                                <Button type="submit" className="flex-1" disabled={loading || !password}>
                                    {loading ? <Spinner /> : confirmLabel}
                                </Button>
                            </div>
                        </form>
                    ) : selectedMethod === "totp" ? (
                        <form onSubmit={onTotpSubmit} className="flex h-full mx-auto flex-col justify-center gap-4 sp-slide-in">
                            <div className="space-y-2 justify-center items-center flex flex-col">
                                <Label htmlFor={totpFieldId}>{t("twoFactor.authenticatorCode")}</Label>
                                <InputOTP
                                    id={totpFieldId}
                                    value={totpCode}
                                    onChange={onTotpCodeChange}
                                    maxLength={6}
                                    autoComplete="one-time-code"
                                    autoFocus
                                    containerClassName="justify-center"
                                >
                                    <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" onClick={onBack}>
                                    <IconArrowLeft className="mr-1 h-4 w-4" />
                                    {t("common.back")}
                                </Button>
                                <Button type="submit" className="flex-1" disabled={loading || !totpCode}>
                                    {loading ? <Spinner /> : confirmLabel}
                                </Button>
                            </div>
                        </form>
                    ) : null}
                </div>
            </div>
        </div>
    );
}