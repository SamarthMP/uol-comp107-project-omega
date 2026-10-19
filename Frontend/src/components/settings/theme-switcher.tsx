import useTheme from "@/hooks/use-theme";
import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { ButtonGroup } from "../ui/button-group";

type ThemePref = "light" | "dark" | "system";

const THEME_OPTIONS: { value: ThemePref; icon: typeof IconSun }[] = [
    { value: "light", icon: IconSun },
    { value: "system", icon: IconDeviceDesktop },
    { value: "dark", icon: IconMoon },
];

export default function ThemeSwitcher() {
    const { setTheme, getTheme } = useTheme();
    const [currentTheme, setCurrentTheme] = useState<ThemePref>(getTheme());
    const { t } = useTranslation();
    const labelId = useId();

    function apply(theme: ThemePref) {
        setCurrentTheme(theme);
        setTheme(theme);
    }

    return (
        <div className="flex w-full flex-col gap-2 py-1">
            <span id={labelId} className="text-sm font-medium">{t("theme.label")}</span>
            <ButtonGroup aria-labelledby={labelId} className="w-full">
                {THEME_OPTIONS.map(({ value, icon: Icon }) => (
                    <Button
                        key={value}
                        className="flex-1"
                        aria-pressed={currentTheme === value}
                        variant={currentTheme === value ? "default" : "outline"}
                        onClick={() => apply(value)}
                    >
                        <Icon />
                        {t(`theme.${value}`)}
                    </Button>
                ))}
            </ButtonGroup>
        </div>
    );
}
