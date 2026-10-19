import AppPage from "@/components/app-page";
import { useTranslation } from "react-i18next";

export default function Home() {
    const { t } = useTranslation();

    return (
        <>
            <AppPage className="flex w-full h-full justify-center items-center flex-col">
                <h1>{t("home.heading")}</h1>
            </AppPage>
        </>
    );
}