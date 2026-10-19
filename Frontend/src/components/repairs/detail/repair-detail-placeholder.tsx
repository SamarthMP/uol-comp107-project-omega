import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import routes from "@/lib/routes";
import { IconClipboardList, IconClipboardX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

// Shown in the detail pane when no job is selected, or the requested job doesn't exist
export default function RepairDetailPlaceholder({ notFound }: { notFound?: boolean }) {
    const { t } = useTranslation();
    const Icon = notFound ? IconClipboardX : IconClipboardList;

    return (
        <Empty className="h-full min-h-72 border bg-card">
            <EmptyHeader>
                <EmptyMedia variant="icon" className="size-12 rounded-full border bg-card text-primary [&_svg:not([class*='size-'])]:size-6">
                    <Icon />
                </EmptyMedia>
                <EmptyTitle>{t(notFound ? "repairs.detail.notFoundTitle" : "repairs.detail.placeholderTitle")}</EmptyTitle>
                <EmptyDescription>{t(notFound ? "repairs.detail.notFoundDescription" : "repairs.detail.placeholderDescription")}</EmptyDescription>
            </EmptyHeader>
            {notFound && (
                <EmptyContent>
                    <Button asChild variant="outline">
                        <Link to={routes.MAIN}>{t("repairs.detail.back")}</Link>
                    </Button>
                </EmptyContent>
            )}
        </Empty>
    );
}
