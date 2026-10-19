import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

const PLACEHOLDER_CARDS = 4;

export default function RepairListSkeleton() {
    const { t } = useTranslation();

    return (
        <div role="status" aria-label={t("repairs.list.loading")} className="flex flex-col gap-2">
            {Array.from({ length: PLACEHOLDER_CARDS }, (_, index) => (
                <div key={index} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
                    <div className="flex justify-between">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            ))}
        </div>
    );
}
