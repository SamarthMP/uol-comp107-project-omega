import type { RefObject } from "react";

// Focuses an element after React has committed the current update, so attributes such as
// aria-invalid and aria-describedby are already in place when assistive tech reads it
export function focusAfterRender(ref: RefObject<HTMLElement | null>) {
    window.requestAnimationFrame(() => ref.current?.focus());
}
