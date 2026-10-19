import { AppSidebar } from "@/components/app-sidebar";
import TopBar from "@/components/app-topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router";

export default function SPALayout() {
    return (
        <>
            <div className="w-full h-full flex">
                <SidebarProvider>
                    <AppSidebar />
                    <div className="w-full h-full">
                        <TopBar></TopBar>
                        <main className="w-full h-full -mt-14">
                            <Outlet />
                        </main>
                    </div>
                </SidebarProvider>
            </div>
        </>
    );
}