import { Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet, FieldTitle } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { RepairPriority } from "@/lib/repairs/repair-types";
import { cn } from "@/lib/utils";
import { IconAlertTriangleFilled, IconFlag } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

const PRIORITIES: RepairPriority[] = ["Normal", "Urgent"];

interface PriorityPickerProps {
    id: string;
    value: RepairPriority;
    onChange: (priority: RepairPriority) => void;
    disabled?: boolean;
}

// Two large, clearly worded choices so the priority can't be picked by accident
export default function PriorityPicker({ id, value, onChange, disabled }: PriorityPickerProps) {
    const { t } = useTranslation();

    return (
        <FieldSet>
            <FieldLegend variant="label">
                {t("repairs.priority.label")}
                <span className="ml-2 font-normal text-muted-foreground">{t("repairs.form.required")}</span>
            </FieldLegend>
            <RadioGroup
                value={value}
                onValueChange={(next) => onChange(next as RepairPriority)}
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                disabled={disabled}
            >
                {PRIORITIES.map((priority) => {
                    const itemId = `${id}-${priority.toLowerCase()}`;
                    const urgent = priority === "Urgent";
                    const Icon = urgent ? IconAlertTriangleFilled : IconFlag;

                    return (
                        <FieldLabel
                            key={priority}
                            htmlFor={itemId}
                            className={cn(
                                "cursor-pointer transition-colors",
                                urgent && "has-data-checked:border-destructive has-data-checked:bg-destructive/8"
                            )}
                        >
                            <Field orientation="horizontal">
                                <RadioGroupItem value={priority} id={itemId} className={cn(urgent && "data-checked:border-destructive data-checked:bg-destructive")} />
                                <FieldContent>
                                    <FieldTitle className={cn("text-sm font-semibold", urgent && "text-destructive")}>
                                        <Icon className="size-4" aria-hidden />
                                        {t(`repairs.priority.${priority}`)}
                                    </FieldTitle>
                                    <FieldDescription>{t(`repairs.priority.hint.${priority}`)}</FieldDescription>
                                </FieldContent>
                            </Field>
                        </FieldLabel>
                    );
                })}
            </RadioGroup>
        </FieldSet>
    );
}
