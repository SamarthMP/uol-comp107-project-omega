import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { IconGripVertical } from "@tabler/icons-react";

interface DragHandleProps {
    setActivatorNodeRef: (element: HTMLElement | null) => void;
    attributes: DraggableAttributes;
    listeners: SyntheticListenerMap | undefined;
}

export default function DragHandle({
    setActivatorNodeRef,
    attributes,
    listeners,
}: DragHandleProps) {
    return (
        <button
            ref={setActivatorNodeRef}
            type="button"
            className="permissions-drag-handle absolute left-4 top-4 z-20 rounded-md border border-border/70 bg-background/80 p-1 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
            onClick={(event) => event.stopPropagation()}
            {...attributes}
            {...listeners}
        >
            <IconGripVertical className="size-4" />
        </button>
    );
}