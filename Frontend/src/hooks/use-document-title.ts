import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// Sets the browser tab title, suffixed with the app name
export default function useDocumentTitle(title: string) {
    const { t } = useTranslation();
    const appName = t("brand.fullName");

    useEffect(() => {
        const previous = document.title;
        document.title = title ? `${title} · ${appName}` : appName;
        return () => {
            document.title = previous;
        };
    }, [title, appName]);
}
