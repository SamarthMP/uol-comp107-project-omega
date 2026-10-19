import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import ThemeSwitcher from "./theme-switcher";

export default function AppearanceSection() {
    const { t } = useTranslation();

    return (
        <Card className="gap-4 p-5 sm:p-6">
            <div>
                <h2 className="text-lg font-semibold">{t("appearance.heading")}</h2>
                <p className="text-sm text-muted-foreground">{t("appearance.description")}</p>
            </div>
            <div className="max-w-sm">
                <ThemeSwitcher />
            </div>
        </Card>
    );
}
