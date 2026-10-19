import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

export default function RepairBoardHeader({ onReport }: { onReport: () => void }) {
    const { t } = useTranslation();

    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                <h1 className="text-2xl">{t("repairs.board.title")}</h1>
                <p className="mt-1 text-muted-foreground">{t("repairs.board.subtitle")}</p>
            </div>
            <Button size="lg" onClick={onReport} className="w-full px-5 sm:w-auto">
                <IconPlus className="size-5" />
                {t("repairs.actions.report")}
            </Button>
        </header>
    );
}
