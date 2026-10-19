import AppLogo from "@/components/brand/app-logo";
import { useAuth } from "@/hooks/use-auth";
import routes from "@/lib/routes";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import UserMenu from "./user-menu";
import { Avatar } from "./ui/avatar";
import { Button } from "./ui/button";
import { LargePopover, LargePopoverContent, LargePopoverDescription, LargePopoverHeader, LargePopoverTitle, LargePopoverTrigger } from "./ui/large-popover";
import { SidebarTrigger } from "./ui/sidebar";

export default function TopBar() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-card px-3 sm:px-4">
            <SidebarTrigger />
            <Link
                to={routes.MAIN}
                className="flex items-center gap-2 rounded-md font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring md:hidden"
            >
                <AppLogo className="size-8" />
                <span className="sr-only sm:not-sr-only">{t("brand.houseName")}</span>
            </Link>

            <div className="ml-auto flex items-center">
                <LargePopover open={menuOpen} onOpenChange={setMenuOpen}>
                    <LargePopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-10" aria-label={t("userMenu.open", { name: user?.displayName ?? "" })}>
                            <Avatar user={user} className="size-9" />
                        </Button>
                    </LargePopoverTrigger>
                    <LargePopoverContent className="m-2 w-80 gap-2" align="end">
                        <LargePopoverHeader className="sr-only">
                            <LargePopoverTitle>{t("userMenu.title")}</LargePopoverTitle>
                            <LargePopoverDescription>{t("userMenu.description")}</LargePopoverDescription>
                        </LargePopoverHeader>
                        <UserMenu onNavigate={() => setMenuOpen(false)} />
                    </LargePopoverContent>
                </LargePopover>
            </div>
        </header>
    );
}
