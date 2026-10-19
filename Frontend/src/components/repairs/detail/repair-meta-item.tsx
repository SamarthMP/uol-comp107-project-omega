import type { TablerIcon } from "@tabler/icons-react";
import type { ReactNode } from "react";

interface RepairMetaItemProps {
    icon: TablerIcon;
    label: string;
    children: ReactNode;
}

// A labelled fact about a job, rendered as a term/definition pair inside a <dl>
export default function RepairMetaItem({ icon: Icon, label, children }: RepairMetaItemProps) {
    return (
        <div className="flex min-w-0 items-start gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden>
                <Icon className="size-4" />
            </span>
            <div className="min-w-0">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="font-medium wrap-anywhere">{children}</dd>
            </div>
        </div>
    );
}
