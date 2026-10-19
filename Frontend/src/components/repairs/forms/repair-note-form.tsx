import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import StatusMessage from "@/components/ui/status-message";
import { useRepairs } from "@/hooks/use-repairs";
import type { ErrorResponse } from "@/lib/auth-types";
import { getBackendErrorMessage } from "@/lib/backend-error";
import { focusAfterRender } from "@/lib/focus";
import { formatTime } from "@/lib/repairs/repair-format";
import { REPAIR_LIMITS, type RepairJob } from "@/lib/repairs/repair-types";
import { checkRequiredText, mapServerFieldErrors } from "@/lib/repairs/repair-validation";
import useStatusTracker from "@/lib/use-status.tracker";
import { IconMessage2Plus } from "@tabler/icons-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import RepairTextField from "./repair-text-field";

// Adds a dated progress note to a job, keeping all earlier notes in its history
export default function RepairNoteForm({ job }: { job: RepairJob }) {
    const { t } = useTranslation();
    const { addNote } = useRepairs();
    const id = useId();
    const status = useStatusTracker();
    const [note, setNote] = useState("");
    const [error, setError] = useState<string>();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    function validate(value: string) {
        const problem = checkRequiredText(value, REPAIR_LIMITS.note);
        return problem ? t(`repairs.note.errors.${problem}`) : undefined;
    }

    function updateNote(value: string) {
        setNote(value);
        if (error) setError(validate(value));
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (status.loading) return;

        const problem = validate(note);
        if (problem) {
            setError(problem);
            status.clear();
            focusAfterRender(textareaRef);
            return;
        }

        setError(undefined);
        status.setStatus("loading");
        try {
            const updated = await addNote(job.id, note.trim());
            setNote("");
            status.setStatus("success", t("repairs.note.saved", { time: formatTime(updated.latestNoteAt ?? updated.updatedAt) }));
        } catch (err: unknown) {
            const serverError = err as ErrorResponse;
            const fieldErrors = mapServerFieldErrors(serverError?.errors);
            if (fieldErrors.note) {
                setError(fieldErrors.note);
                status.clear();
                focusAfterRender(textareaRef);
                return;
            }
            status.setStatus("error", getBackendErrorMessage(serverError, t("repairs.note.failed")));
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
            <RepairTextField
                id={`${id}-note`}
                label={t("repairs.note.label")}
                hint={t("repairs.note.hint")}
                placeholder={t("repairs.note.placeholder")}
                value={note}
                onChange={updateNote}
                error={error}
                maxLength={REPAIR_LIMITS.note}
                textareaRef={textareaRef}
                multiline
                required
            />
            <Button type="submit" variant="secondary" size="lg" className="w-full sm:w-auto sm:self-start" aria-disabled={status.loading || undefined}>
                {status.loading ? <Spinner /> : <IconMessage2Plus />}
                {t("repairs.actions.saveNote")}
            </Button>
            <StatusMessage {...status} />
        </form>
    );
}
