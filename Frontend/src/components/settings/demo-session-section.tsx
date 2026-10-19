import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { IconRefresh } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

// Explains the passwordless demo account and lets people start over with a fresh one
export default function DemoSessionSection() {
    const { t } = useTranslation();
    const { signOut } = useAuth();

    return (
        <Card className="gap-4 p-5 sm:p-6">
            <div>
                <h2 className="text-lg font-semibold">{t("demoSession.heading")}</h2>
                <p className="text-sm text-muted-foreground">{t("demoSession.settingsDescription")}</p>
            </div>
            <Button variant="outline" className="self-start" onClick={signOut}>
                <IconRefresh />
                {t("demoSession.newSession")}
            </Button>
        </Card>
    );
}
