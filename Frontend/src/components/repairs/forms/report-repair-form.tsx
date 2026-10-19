import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import StatusMessage from "@/components/ui/status-message";
import { useRepairs } from "@/hooks/use-repairs";
import type { ErrorResponse } from "@/lib/auth-types";
import { getBackendErrorMessage } from "@/lib/backend-error";
import { focusAfterRender } from "@/lib/focus";
import { REPAIR_LIMITS, type RepairJob, type RepairPriority } from "@/lib/repairs/repair-types";
import { checkRequiredText, mapServerFieldErrors } from "@/lib/repairs/repair-validation";
import useStatusTracker from "@/lib/use-status.tracker";
import { IconHome, IconSend } from "@tabler/icons-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import PriorityPicker from "./priority-picker";
import RepairTextField from "./repair-text-field";

interface ReportErrors {
    description?: string;
    reporterName?: string;
}

interface ReportRepairFormProps {
    reporterSuggestions: string[];
    onCreated: (job: RepairJob) => void;
    onCancel: () => void;
}

export default function ReportRepairForm({ reporterSuggestions, onCreated, onCancel }: ReportRepairFormProps) {
    const { t } = useTranslation();
    const { createJob } = useRepairs();
    const id = useId();
    const status = useStatusTracker();

    const [description, setDescription] = useState("");
    const [reporterName, setReporterName] = useState("");
    const [priority, setPriority] = useState<RepairPriority>("Normal");
    const [errors, setErrors] = useState<ReportErrors>({});

    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const reporterRef = useRef<HTMLInputElement>(null);
    const suggestionsId = `${id}-reporters`;

    function validateDescription(value: string) {
        const problem = checkRequiredText(value, REPAIR_LIMITS.description);
        return problem ? t(`repairs.report.errors.description.${problem}`) : undefined;
    }

    function validateReporter(value: string) {
        const problem = checkRequiredText(value, REPAIR_LIMITS.reporterName);
        return problem ? t(`repairs.report.errors.reporterName.${problem}`) : undefined;
    }

    // Once a field has shown an error, re-check it as the user types so the message clears when fixed
    function updateDescription(value: string) {
        setDescription(value);
        if (errors.description) setErrors((current) => ({ ...current, description: validateDescription(value) }));
    }

    function updateReporter(value: string) {
        setReporterName(value);
        if (errors.reporterName) setErrors((current) => ({ ...current, reporterName: validateReporter(value) }));
    }

    function showErrors(nextErrors: ReportErrors) {
        setErrors(nextErrors);
        const count = Object.values(nextErrors).filter(Boolean).length;
        status.setStatus("error", t("repairs.report.fixErrors", { count }));

        if (nextErrors.description) focusAfterRender(descriptionRef);
        else if (nextErrors.reporterName) focusAfterRender(reporterRef);
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (status.loading) return;

        const nextErrors: ReportErrors = {
            description: validateDescription(description),
            reporterName: validateReporter(reporterName),
        };
        if (nextErrors.description || nextErrors.reporterName) {
            showErrors(nextErrors);
            return;
        }

        setErrors({});
        status.setStatus("loading");
        try {
            const job = await createJob({
                description: description.trim(),
                reporterName: reporterName.trim(),
                priority,
            });
            status.clear();
            onCreated(job);
        } catch (err: unknown) {
            const error = err as ErrorResponse;
            const fieldErrors = mapServerFieldErrors(error?.errors);
            if (fieldErrors.description || fieldErrors.reportername) {
                showErrors({ description: fieldErrors.description, reporterName: fieldErrors.reportername });
                return;
            }
            status.setStatus("error", getBackendErrorMessage(error, t("repairs.report.failed")));
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <StatusMessage {...status} />

            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-3 py-2 text-sm">
                <IconHome className="size-4 shrink-0 text-primary" aria-hidden />
                <span>
                    {t("repairs.report.house")} <strong>{t("brand.houseName")}</strong>
                </span>
                <span className="ml-auto text-muted-foreground">{t("repairs.report.houseAutomatic")}</span>
            </p>

            <RepairTextField
                id={`${id}-description`}
                label={t("repairs.report.descriptionLabel")}
                hint={t("repairs.report.descriptionHint")}
                placeholder={t("repairs.report.descriptionPlaceholder")}
                value={description}
                onChange={updateDescription}
                error={errors.description}
                maxLength={REPAIR_LIMITS.description}
                textareaRef={descriptionRef}
                multiline
                required
            />

            <RepairTextField
                id={`${id}-reporter`}
                label={t("repairs.report.reporterLabel")}
                hint={t("repairs.report.reporterHint")}
                placeholder={t("repairs.report.reporterPlaceholder")}
                value={reporterName}
                onChange={updateReporter}
                error={errors.reporterName}
                maxLength={REPAIR_LIMITS.reporterName}
                inputRef={reporterRef}
                autoComplete="name"
                suggestionsListId={suggestionsId}
                required
            />
            <datalist id={suggestionsId}>
                {reporterSuggestions.map((name) => <option key={name} value={name} />)}
            </datalist>

            <PriorityPicker id={`${id}-priority`} value={priority} onChange={setPriority} />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" size="lg" onClick={onCancel} disabled={status.loading}>
                    {t("common.cancel")}
                </Button>
                <Button type="submit" size="lg" aria-disabled={status.loading || undefined}>
                    {status.loading ? <Spinner /> : <IconSend />}
                    {t("repairs.actions.submitReport")}
                </Button>
            </div>
        </form>
    );
}
