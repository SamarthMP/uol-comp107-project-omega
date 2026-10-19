import { useAuth } from "@/hooks/use-auth";
import routes from "@/lib/routes";
import { IconLogout, IconSettings, IconUserPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import ThemeSwitcher from "./settings/theme-switcher";
import { Avatar } from "./ui/avatar";
import { Button } from "./ui/button";
import { LargePopover, LargePopoverContent, LargePopoverTrigger } from "./ui/large-popover";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";

export default function TopBar() {
    const { user } = useAuth();

    return (
        <div className="w-full h-14 flex items-center px-3 z-10">
            <SidebarTrigger />    
            <TopBarPopover>
                <Avatar user={user} className="ml-auto cursor-pointer w-10 h-10"/>
            </TopBarPopover>
        </div>
    );
}

function TopBarPopover({ children }: { children: React.ReactNode }) {

    const { user, signOut } = useAuth();
    const { t } = useTranslation();

    return (
        <LargePopover>
            <LargePopoverTrigger asChild>
                {children}
            </LargePopoverTrigger>
            <LargePopoverContent className="m-2 gap-2" align="end">
                <UserPopover />
                <Separator className="my-0 py-0" />
                <div className="flex flex-col gap-1">
                    <ThemeSwitcher />
                    <Link to={routes.SETTINGS}>
                        <Button className="w-full" variant="outline"><IconSettings />{t("common.settings")}</Button>
                    </Link>
                </div>
            </LargePopoverContent>
        </LargePopover>
    );
}

function UserPopover() {
    const { user, signOut } = useAuth();
    const { t } = useTranslation();

    // Fallback sign in button if user is not authenticated
    if (!user || !user.id) {
        return (
            <div className="flex flex-grow items-center w-full">
                <Link className="w-full" to={routes.SIGN_IN}>
                    <Button className="w-full" variant="outline"><IconUserPlus /> {t("common.signIn")}</Button>
                </Link>
            </div>
        );
    }

    // Used to prevent showing the email twice
    const isDisplayNameSameAsEmail = user.displayName?.toLowerCase() === user.email?.toLowerCase();

    return (
        <>
            <div className="flex flex-col justify-center items-center py-1 gap-2">
                {
                    !isDisplayNameSameAsEmail && (
                        <span className="text-sm text-muted-foreground mb-2">{user.email}</span>
                    )
                }
                <Avatar user={user} className="w-20 h-20"/>
                <span className="text-lg font-semibold">{user.displayName}</span>
                <Button className="px-4" variant="ghost" onClick={signOut}><IconLogout />{t("common.signOut")}</Button>
            </div>
        </>
    );
}