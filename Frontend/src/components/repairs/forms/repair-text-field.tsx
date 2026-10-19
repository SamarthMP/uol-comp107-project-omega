import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Ref } from "react";
import { useTranslation } from "react-i18next";

interface RepairTextFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    maxLength: number;
    hint?: string;
    error?: string;
    placeholder?: string;
    multiline?: boolean;
    required?: boolean;
    disabled?: boolean;
    autoComplete?: string;
    suggestionsListId?: string;
    className?: string;
    inputRef?: Ref<HTMLInputElement>;
    textareaRef?: Ref<HTMLTextAreaElement>;
}

// Labelled text input or textarea with a hint, live character count and an error that is tied to the control
export default function RepairTextField({
    id,
    label,
    value,
    onChange,
    maxLength,
    hint,
    error,
    placeholder,
    multiline,
    required,
    disabled,
    autoComplete,
    suggestionsListId,
    className,
    inputRef,
    textareaRef,
}: RepairTextFieldProps) {
    const { t } = useTranslation();
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

    const sharedProps = {
        id,
        value,
        maxLength,
        placeholder,
        required,
        disabled,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
    };

    return (
        <Field data-invalid={error ? true : undefined} className={className}>
            <FieldLabel htmlFor={id}>
                {label}
                {required && <span className="font-normal text-muted-foreground">{t("repairs.form.required")}</span>}
            </FieldLabel>

            {multiline ? (
                <Textarea
                    {...sharedProps}
                    ref={textareaRef}
                    onChange={(event) => onChange(event.target.value)}
                    className="min-h-28 resize-y text-base leading-relaxed wrap-anywhere text-foreground sm:text-sm"
                />
            ) : (
                <Input
                    {...sharedProps}
                    ref={inputRef}
                    list={suggestionsListId}
                    autoComplete={autoComplete}
                    onChange={(event) => onChange(event.target.value)}
                    className="text-base text-foreground sm:text-sm"
                />
            )}

            <div className="flex items-start justify-between gap-3">
                {hint && <FieldDescription id={hintId}>{hint}</FieldDescription>}
                <span
                    aria-hidden
                    className={cn(
                        "ml-auto shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground",
                        value.length >= maxLength && "font-semibold text-destructive"
                    )}
                >
                    {value.length}/{maxLength}
                </span>
            </div>

            <FieldError id={errorId}>{error}</FieldError>
        </Field>
    );
}
