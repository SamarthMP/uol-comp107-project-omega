import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

export default function RepairBoardHeader({ onReport }: { onReport: () => void }) {
    const { t } = useTranslation();

    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                <p className="text-sm font-semibold tracking-wide text-primary uppercase">{t("brand.houseName")}</p>
                <h1 className="mt-1 text-3xl leading-tight sm:text-4xl">{t("repairs.board.title")}</h1>
                <p className="mt-1 text-muted-foreground">{t("repairs.board.subtitle")}</p>
            </div>
            <Button size="lg" onClick={onReport} className="h-11 w-full px-5 text-base shadow-sm sm:w-auto">
                <IconPlus className="size-5" />
                {t("repairs.actions.report")}
            </Button>
        </header>
    );
}
