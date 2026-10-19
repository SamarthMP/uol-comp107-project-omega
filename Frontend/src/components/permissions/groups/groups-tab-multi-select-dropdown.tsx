import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { IconSelector } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface MultiSelectDropdownProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}

export default function MultiSelectDropdown({
    options,
    value,
    onChange,
    placeholder,
}: MultiSelectDropdownProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    const selected = useMemo(
        () => value.split(",").map((option) => option.trim()).filter(Boolean),
        [value],
    );

    const displayText = selected.length > 0 ? selected.join(", ") : placeholder;

    const toggle = (option: string) => {
        const next = selected.includes(option)
            ? selected.filter((selectedOption) => selectedOption !== option)
            : [...selected, option];

        onChange(next.join(","));
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        "w-full justify-between font-normal",
                        selected.length === 0 && "text-muted-foreground",
                    )}
                >
                    <span className="truncate">{displayText}</span>
                    <IconSelector className="size-4 shrink-0 text-muted-foreground" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
                <div className="space-y-0.5">
                    {options.map((option) => (
                        <button
                            key={option}
                            type="button"
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                            onClick={() => toggle(option)}
                        >
                            <Checkbox checked={selected.includes(option)} />
                            <span>{option}</span>
                        </button>
                    ))}
                </div>

                {selected.length > 0 && (
                    <>
                        <Separator className="my-1" />
                        <button
                            type="button"
                            className="flex w-full items-center justify-center rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent"
                            onClick={() => onChange("")}
                        >
                            {t("permissions.clearSelection")}
                        </button>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
}