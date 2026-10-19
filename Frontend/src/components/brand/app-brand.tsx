import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import AppLogo from "./app-logo";

interface AppBrandProps {
    className?: string;
    logoClassName?: string;
}

export default function AppBrand({ className, logoClassName }: AppBrandProps) {
    const { t } = useTranslation();

    return (
        <span className={cn("flex items-center gap-2.5", className)}>
            <AppLogo className={logoClassName} />
            <span className="flex flex-col leading-tight">
                <span className="text-base font-bold tracking-tight">{t("brand.houseName")}</span>
                <span className="text-sm text-muted-foreground">{t("brand.product")}</span>
            </span>
        </span>
    );
}
