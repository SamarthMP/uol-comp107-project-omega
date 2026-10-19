import useTheme from "@/hooks/use-theme";
import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { ButtonGroup } from "../ui/button-group";

type ThemePref = "light" | "dark" | "system";

export default function ThemeSwitcher() {
    const { setTheme, getTheme } = useTheme();
    const [currentTheme, setCurrentTheme] = useState<ThemePref>(getTheme());
    const { t } = useTranslation();

    function apply(t: ThemePref) {
        setCurrentTheme(t);
        setTheme(t);
    }

    function getVariant(t: ThemePref) {
        return currentTheme === t ? "default" : "outline";
    }

    return (
        <div className="flex w-full items-center justify-between py-1">
            <span className="w-full text-md text-left font-medium">{t("theme.label")}</span>
            <ButtonGroup>
                <Button variant={getVariant("light")} onClick={() => apply("light")}><IconSun /> {t("theme.light")}</Button>
                <Button variant={getVariant("system")} onClick={() => apply("system")}><IconDeviceDesktop /> {t("theme.system")}</Button>
                <Button variant={getVariant("dark")} onClick={() => apply("dark")}><IconMoon /> {t("theme.dark")}</Button>
            </ButtonGroup>
        </div>
    );
}