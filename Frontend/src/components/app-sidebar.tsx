import AppBrand from "@/components/brand/app-brand";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    useSidebar
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import routes from "@/lib/routes";
import { cn } from "@/lib/utils";
import { IconSettings, IconShieldLock, IconTool } from "@tabler/icons-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { Avatar } from "./ui/avatar";

interface SidebarItem {
    name: string;
    href?: string;
    // Extra path prefixes that should also mark this item as active
    activePrefixes?: string[];
    children?: SidebarItem[];
    icon?: React.ComponentType<{ className?: string }>;
}

const baseSections: SidebarItem[] = [
    {
        name: "nav.repairs",
        href: routes.MAIN,
        activePrefixes: [routes.JOBS],
        icon: IconTool
    },
    {
        name: "common.settings",
        href: routes.SETTINGS,
        icon: IconSettings
    }
];

export function AppSidebar() {
    const { t } = useTranslation();
    const { user } = useAuth();

    const sections = useMemo(() => {
        const items = [...baseSections];
        if (user?.permissions?.includes("SuperAdmin")) {
            items.push({
                name: "permissions.adminSection",
                children: [
                    {
                        name: "permissions.heading",
                        href: routes.PERMISSIONS,
                        icon: IconShieldLock
                    }
                ]
            });
        }
        return items;
    }, [user]);

    return (
        <Sidebar>
            <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-4">
                <Link to={routes.MAIN} className="rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring">
                    <AppBrand />
                </Link>
            </SidebarHeader>
            <SidebarContent className="pt-3">
                <nav aria-label={t("nav.label")}>
                    <SidebarMenu className="gap-1">
                        {sections.filter((section) => !section.children).map((section) => (
                            <SidebarLink key={section.name} {...section} />
                        ))}
                    </SidebarMenu>

                    {sections.filter((section) => section.children).map((section) => (
                        <SidebarGroup key={section.name} id={section.name}>
                            <SidebarGroupLabel>{t(section.name)}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu className="gap-1">
                                    {section.children!.map((child) => (
                                        <SidebarLink isGrouped key={child.name} {...child} />
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    ))}
                </nav>
            </SidebarContent>
            <SidebarFooter className="border-t border-sidebar-border p-3">
                <div className="flex items-center gap-3 p-2">
                    <Avatar user={user} className="size-9" />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{user?.displayName}</p>
                        <p className="truncate text-sm text-muted-foreground">{t("userMenu.demoSession")}</p>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}

function SidebarLink({ name, href, activePrefixes, icon: Icon, isGrouped }: SidebarItem & { isGrouped?: boolean }) {
    const location = useLocation();
    const { t } = useTranslation();
    const { isMobile, setOpenMobile } = useSidebar();
    const isActive = location.pathname === href
        || (activePrefixes ?? []).some((prefix) => location.pathname.startsWith(prefix));

    return (
        <SidebarMenuItem>
            <Link
                to={href!}
                aria-current={isActive ? "page" : undefined}
                onClick={() => isMobile && setOpenMobile(false)}
                className={cn(
                    "relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground outline-none",
                    "transition-colors duration-200 ease-sp-md hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-[3px] focus-visible:ring-ring",
                    isActive && "bg-sidebar-accent font-semibold text-sidebar-foreground before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-primary",
                    isGrouped ? "mx-0" : "mx-3"
                )}
            >
                {Icon && <Icon className={cn("size-5", isActive && "text-primary")} />}
                {t(name)}
            </Link>
        </SidebarMenuItem>
    );
}
