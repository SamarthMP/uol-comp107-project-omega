import AppPage from "@/components/app-page";
import SudoDialog from "@/components/auth/sudo-dialog";
import DataSection from "@/components/settings/data-section";
import PasskeysSection from "@/components/settings/passkeys-section";
import ProfileSection from "@/components/settings/profile-section";
import SecuritySection from "@/components/settings/security-section";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { IconLogout } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function Settings() {
    const { user, signOut } = useAuth();
    const { t } = useTranslation();

    const [sudoDialogOpen, setSudoDialogOpen] = useState(false);
    const [pendingSudoAction, setPendingSudoAction] = useState<(() => void) | null>(null);

    function requireSudo(action: () => void) {
        setPendingSudoAction(() => action);
        setSudoDialogOpen(true);
    }

    function handleSudoConfirm() {
        setSudoDialogOpen(false);
        if (pendingSudoAction) {
            pendingSudoAction();
            setPendingSudoAction(null);
        }
    }

    async function handleSignOut() {
        signOut();
    }

    if (!user) return null;

    return (
        <>
            <AppPage className="flex w-full h-full flex-col mt-14 pb-22 p-8 overflow-y-auto">
                <div className="flex-1">
                    <div className="max-w-2xl space-y-6 mx-auto">
                        <div>
                            <h1 className="mb-1">{t("settings.heading")}</h1>
                            <p className="text-muted-foreground">{t("settings.description")}</p>
                        </div>

                        <ProfileSection onRequireSudo={requireSudo} />
                        <SecuritySection onRequireSudo={requireSudo} />
                        <PasskeysSection onRequireSudo={requireSudo} />
                        <DataSection onRequireSudo={requireSudo} />

                        <Button
                            size="lg"
                            className="flex ml-auto"
                            onClick={handleSignOut}
                        >
                            <IconLogout />
                            {t("common.signOut")}
                        </Button>
                    </div>
                </div>
            </AppPage>

            <SudoDialog
                open={sudoDialogOpen}
                onClose={() => {
                    setSudoDialogOpen(false);
                    setPendingSudoAction(null);
                }}
                onConfirm={handleSudoConfirm}
            />
        </>
    );
}
