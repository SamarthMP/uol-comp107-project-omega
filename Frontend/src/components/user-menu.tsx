import { useAuth } from "@/hooks/use-auth";
import routes from "@/lib/routes";
import { IconRefresh, IconSettings } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import ThemeSwitcher from "./settings/theme-switcher";
import { Avatar } from "./ui/avatar";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

// Contents of the account popover: who you are, theme, settings, and starting a fresh demo session
export default function UserMenu({ onNavigate }: { onNavigate: () => void }) {
    const { user, signOut } = useAuth();
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col items-center gap-2 py-1 text-center">
                <Avatar user={user} className="size-16" />
                <div className="min-w-0">
                    <p className="text-lg font-semibold wrap-anywhere">{user?.displayName}</p>
                    <p className="text-sm text-muted-foreground">{t("userMenu.demoSession")}</p>
                </div>
            </div>
            <Separator />
            <ThemeSwitcher />
            <Button asChild variant="outline" className="w-full">
                <Link to={routes.SETTINGS} onClick={onNavigate}>
                    <IconSettings />
                    {t("common.settings")}
                </Link>
            </Button>
            <Button variant="ghost" className="w-full" onClick={signOut}>
                <IconRefresh />
                {t("demoSession.newSession")}
            </Button>
        </div>
    );
}
