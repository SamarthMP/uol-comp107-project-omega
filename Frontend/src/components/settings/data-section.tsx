import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { deleteAccount } from "@/lib/auth-client";
import useStatusTracker from "@/lib/use-status.tracker";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Spinner } from "../ui/spinner";
import StatusMessage from "../ui/status-message";

interface DataSectionProps {
    onRequireSudo: (action: () => void) => void;
}

export default function DataSection({ onRequireSudo }: DataSectionProps) {
    const { user, signOut: logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const status = useStatusTracker();

    function handleDeleteAccount() {
        onRequireSudo(async () => {
            status.setStatus("loading");
            try {
                await deleteAccount();
                logout();
                navigate("/");
            } catch (err: unknown) {
                const e = err as { error?: string };
                status.setStatus("error", e?.error ?? t("errors.failedToDeleteAccount"));
            }
        });
    }

    if (!user) return null;

    return (
        <Card>
            <h6>{t("data.heading")}</h6>
            <p className="text-sm text-muted-foreground">
                {t("data.description")}
            </p>

            <StatusMessage {...status} />

            <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={status.loading}
            >
                {status.loading ? <Spinner /> : t("data.deleteAccount")}
            </Button>
        </Card>
    );
}
