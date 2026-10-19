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
            <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="font-medium wrap-anywhere">{children}</dd>
            </div>
        </div>
    );
}
