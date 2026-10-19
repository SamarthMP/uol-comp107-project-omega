import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import StatusMessage from "@/components/ui/status-message";
import { useRepairs } from "@/hooks/use-repairs";
import type { ErrorResponse } from "@/lib/auth-types";
import { getBackendErrorMessage } from "@/lib/backend-error";
import { focusAfterRender } from "@/lib/focus";
import { REPAIR_LIMITS, type RepairJob } from "@/lib/repairs/repair-types";
import { checkRequiredText, mapServerFieldErrors } from "@/lib/repairs/repair-validation";
import useStatusTracker from "@/lib/use-status.tracker";
import { IconCircleCheck } from "@tabler/icons-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import RepairTextField from "./repair-text-field";

interface RepairCompleteFormProps {
    job: RepairJob;
    onCompleted: (job: RepairJob) => void;
}

// Marks a job Completed. A blank or whitespace-only note is rejected and leaves the job exactly as it was.
export default function RepairCompleteForm({ job, onCompleted }: RepairCompleteFormProps) {
    const { t } = useTranslation();
    const { completeJob } = useRepairs();
    const id = useId();
    const status = useStatusTracker();
    const [completionNote, setCompletionNote] = useState("");
    const [error, setError] = useState<string>();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    function validate(value: string) {
        const problem = checkRequiredText(value, REPAIR_LIMITS.note);
        return problem ? t(`repairs.complete.errors.${problem}`) : undefined;
    }

    function updateNote(value: string) {
        setCompletionNote(value);
        if (error) setError(validate(value));
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (status.loading) return;

        const problem = validate(completionNote);
        if (problem) {
            setError(problem);
            status.clear();
            focusAfterRender(textareaRef);
            return;
        }

        setError(undefined);
        status.setStatus("loading");
        try {
            const updated = await completeJob(job.id, completionNote.trim());
            status.clear();
            onCompleted(updated);
        } catch (err: unknown) {
            const serverError = err as ErrorResponse;
            const fieldErrors = mapServerFieldErrors(serverError?.errors);
            if (fieldErrors.completionnote) {
                setError(fieldErrors.completionnote);
                status.clear();
                focusAfterRender(textareaRef);
                return;
            }
            status.setStatus("error", getBackendErrorMessage(serverError, t("repairs.complete.failed")));
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
            <RepairTextField
                id={`${id}-completion`}
                label={t("repairs.complete.label")}
                hint={t("repairs.complete.hint")}
                placeholder={t("repairs.complete.placeholder")}
                value={completionNote}
                onChange={updateNote}
                error={error}
                maxLength={REPAIR_LIMITS.note}
                textareaRef={textareaRef}
                multiline
                required
            />
            <Button type="submit" size="lg" className="w-full sm:w-auto sm:self-start" aria-disabled={status.loading || undefined}>
                {status.loading ? <Spinner /> : <IconCircleCheck />}
                {t("repairs.actions.complete")}
            </Button>
            <StatusMessage {...status} />
        </form>
    );
}
