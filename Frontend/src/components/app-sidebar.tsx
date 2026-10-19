import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenuItem
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import routes from "@/lib/routes";
import { cn } from "@/lib/utils";
import { IconHome, IconSettings, IconShieldLock } from "@tabler/icons-react";
import { t } from "i18next";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";

interface SidebarItem {
    name: string;
    href?: string;
    children?: SidebarItem[];
    icon?: React.ComponentType<{ className?: string }>;
}

const baseSections: SidebarItem[] = [
    {
        name: "common.home",
        href: routes.MAIN,
        icon: IconHome
    },
    {
        name: "common.settings",
        children: [
            {
                name: "common.settings",
                href: routes.SETTINGS,
                icon: IconSettings
            }
        ]
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
            <SidebarHeader >
                {/* TODO: Replace logo/app name here */}
                <div className="h-14 flex items-center justify-center gap-3">
                    <img alt="SamarthMP GitHub PFP" className="w-12 h-12 rounded-full" src="https://avatars.githubusercontent.com/u/79756986?v=4" />
                    <a href="https://github.com/SamarthMP" target="_blank" className="font-bold text-lg">Samarth's Stack</a>
                </div>
            </SidebarHeader>
            <SidebarContent>
                {sections.map((section) => {

                    // Plain link without children
                    if (!section.children) {
                        return <SidebarLink key={section.name} {...section} />;
                    }

                    // Section with children
                    return (
                        <SidebarGroup key={section.name} id={section.name}>
                            <SidebarGroupLabel>{t(section.name)}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                {section.children.map((child) => (
                                    <SidebarLink isGrouped key={child.name} {...child} />
                                ))}
                            </SidebarGroupContent>
                        </SidebarGroup>
                    );
                })}
            </SidebarContent>
            <SidebarFooter className="border-t border-border">
            </SidebarFooter>
        </Sidebar>
    );
}

function SidebarLink({ name, href, icon: Icon, isGrouped }: SidebarItem & { isGrouped?: boolean }) {

    const location = useLocation();
    const isActive = location.pathname === href;

    return (
        <SidebarMenuItem key={name} className="relative">
            <Link className={cn(
                "h-10 flex items-center gap-2 pl-4 pr-4 rounded-lg",
                "transition-all ease-sp-md duration-300 hover:bg-primary/10",
                isActive && "bg-primary/20! pl-5",
                isGrouped ? "mx-2" : "mx-4"
            )} to={href!}>
                {Icon && <Icon className="w-5 h-5" />}

                <span className={cn("text-sm", isActive && "font-medium")}>
                    {t(name)}
                </span>
            </Link>
        </SidebarMenuItem>
    );
}