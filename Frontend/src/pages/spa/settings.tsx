import AppPage from "@/components/app-page";
import AppearanceSection from "@/components/settings/appearance-section";
import DemoSessionSection from "@/components/settings/demo-session-section";
import ProfileSection from "@/components/settings/profile-section";
import useDocumentTitle from "@/hooks/use-document-title";
import { useTranslation } from "react-i18next";

export default function Settings() {
    const { t } = useTranslation();
    useDocumentTitle(t("settings.heading"));

    return (
        <AppPage>
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
                <div>
                    <h1 className="mb-1 text-3xl sm:text-4xl">{t("settings.heading")}</h1>
                    <p className="text-muted-foreground">{t("settings.description")}</p>
                </div>

                <ProfileSection />
                <AppearanceSection />
                <DemoSessionSection />
            </div>
        </AppPage>
    );
}
