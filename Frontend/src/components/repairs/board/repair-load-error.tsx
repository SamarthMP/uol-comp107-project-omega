import { Button } from "@/components/ui/button";
import StatusMessage from "@/components/ui/status-message";
import { useRepairs } from "@/hooks/use-repairs";
import { IconRefresh } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

// Shown when the repairs couldn't be loaded at all, with a way to try again
export default function RepairLoadError({ message }: { message: string }) {
    const { t } = useTranslation();
    const { reload } = useRepairs();

    return (
        <div className="flex flex-col gap-3">
            <StatusMessage status="error" title={t("repairs.list.loadFailed")} message={message} />
            <Button variant="outline" className="self-start" onClick={() => void reload()}>
                <IconRefresh />
                {t("common.retry")}
            </Button>
        </div>
    );
}
