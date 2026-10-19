import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { focusElementById, jobHeadingId } from "@/lib/repairs/repair-dom";
import type { RepairJob } from "@/lib/repairs/repair-types";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import ReportRepairForm from "./report-repair-form";

interface ReportRepairDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reporterSuggestions: string[];
    onCreated: (job: RepairJob) => void;
}

export default function ReportRepairDialog({ open, onOpenChange, reporterSuggestions, onCreated }: ReportRepairDialogProps) {
    const { t } = useTranslation();
    const openerRef = useRef<HTMLElement | null>(null);
    const createdJobIdRef = useRef<number | null>(null);

    function handleCreated(job: RepairJob) {
        createdJobIdRef.current = job.id;
        onCreated(job);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto p-5 sm:max-w-xl sm:p-6"
                onOpenAutoFocus={() => {
                    // The dialog is opened from several buttons, so remember which one to return to
                    openerRef.current = document.activeElement as HTMLElement | null;
                    createdJobIdRef.current = null;
                }}
                onCloseAutoFocus={(event) => {
                    // Runs once the dialog has fully closed: go to the new job after a report, otherwise back to the opener
                    event.preventDefault();
                    const createdJobId = createdJobIdRef.current;
                    createdJobIdRef.current = null;

                    if (createdJobId !== null) {
                        focusElementById(jobHeadingId(createdJobId));
                    } else {
                        openerRef.current?.focus();
                    }
                }}
            >
                <DialogHeader className="pr-8">
                    <DialogTitle className="text-2xl">{t("repairs.report.title")}</DialogTitle>
                    <DialogDescription className="mb-0">{t("repairs.report.description")}</DialogDescription>
                </DialogHeader>
                <ReportRepairForm
                    reporterSuggestions={reporterSuggestions}
                    onCreated={handleCreated}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
