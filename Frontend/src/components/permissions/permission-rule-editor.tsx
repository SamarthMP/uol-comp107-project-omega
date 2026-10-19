import { Button } from "@/components/ui/button";
import type { PermissionRule, PermissionRuleMode } from "@/lib/permission-types";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const RULE_MODES: PermissionRuleMode[] = ["Inherit", "Allow", "Block"];

function getRuleMode(rules: PermissionRule[], flag: string): PermissionRuleMode {
    return rules.find((rule) => rule.flag === flag)?.mode ?? "Inherit";
}

function upsertRule(rules: PermissionRule[], flag: string, mode: PermissionRuleMode): PermissionRule[] {
    const nextRules = rules.filter((rule) => rule.flag !== flag);

    if (mode === "Inherit") {
        return nextRules;
    }

    return [...nextRules, { flag, mode }].sort((left, right) => left.flag.localeCompare(right.flag));
}

export function PermissionRuleEditor({
    allFlags,
    rules,
    onChange,
    compact = false,
}: {
    allFlags: string[];
    rules: PermissionRule[];
    onChange: (rules: PermissionRule[]) => void;
    compact?: boolean;
}) {
    const { t } = useTranslation();

    return (
        <div className="space-y-2">
            {allFlags.map((flag) => {
                const mode = getRuleMode(rules, flag);

                return (
                    <div
                        key={flag}
                        className={cn(
                            "grid items-center gap-3 rounded-xl border border-border/70 bg-card/70 p-3 transition-colors duration-200 hover:border-border hover:bg-accent/20",
                            compact ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto]",
                        )}
                    >
                        <div className="min-w-0">
                            <div className="font-medium text-sm">{flag}</div>
                            <div className="text-xs text-muted-foreground">
                                {t(`permissions.ruleModeDescription.${mode}`)}
                            </div>
                        </div>

                        <div className="inline-flex flex-wrap rounded-lg border border-border/70 bg-background/70 p-1 gap-1">
                            {RULE_MODES.map((candidateMode) => (
                                <Button
                                    key={candidateMode}
                                    type="button"
                                    size="sm"
                                    variant={mode === candidateMode ? ruleVariant[candidateMode] : "ghost"}
                                    className={cn(
                                        "min-w-20 transition-all duration-200",
                                        mode === candidateMode && "shadow-sm",
                                    )}
                                    onClick={() => onChange(upsertRule(rules, flag, candidateMode))}
                                >
                                    {t(`permissions.ruleMode.${candidateMode}`)}
                                </Button>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function getPermissionRuleMode(rules: PermissionRule[], flag: string): PermissionRuleMode {
    return getRuleMode(rules, flag);
}

const ruleVariant: Record<PermissionRuleMode, "secondary" | "default" | "destructive"> = {
    Inherit: "secondary",
    Allow: "default",
    Block: "destructive",
};
