import { cn } from "@/lib/utils";
import type { Ref } from "react";

interface AppPageProps {
    children: React.ReactNode;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

export default function AppPage({ children, className, ref }: AppPageProps) {
    return (
        <div ref={ref} className={cn("flex h-full w-full flex-col overflow-y-auto p-4 pb-10 sm:p-6 lg:p-8 sp-page-anim", className)}>
            {children}
        </div>
    );
}
