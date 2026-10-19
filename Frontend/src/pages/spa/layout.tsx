import { AppSidebar } from "@/components/app-sidebar";
import TopBar from "@/components/app-topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner";
import { RealtimeProvider } from "@/hooks/use-realtime";
import { RepairsProvider } from "@/hooks/use-repairs";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";

export default function SPALayout() {
    const { t } = useTranslation();

    return (
        <RealtimeProvider>
            <RepairsProvider>
                <SidebarProvider className="h-full min-h-0">
                    <a
                        href="#main-content"
                        className="sr-only z-50 rounded-md bg-primary font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:px-4 focus:py-2"
                    >
                        {t("layout.skipToContent")}
                    </a>
                    <AppSidebar />
                    <div className="flex h-full min-w-0 flex-1 flex-col">
                        <TopBar />
                        <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 outline-none">
                            <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner className="size-6 text-primary" /></div>}>
                                <Outlet />
                            </Suspense>
                        </main>
                    </div>
                    <Toaster position="bottom-right" closeButton richColors={false} />
                </SidebarProvider>
            </RepairsProvider>
        </RealtimeProvider>
    );
}
