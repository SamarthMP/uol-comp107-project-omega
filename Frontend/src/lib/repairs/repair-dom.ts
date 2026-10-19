// Stable element ids, so focus can be moved to a job from outside its component tree

export function jobHeadingId(jobId: number) {
    return `repair-${jobId}-heading`;
}

export function jobCardId(jobId: number) {
    return `repair-${jobId}-card`;
}

// Focuses an element by id, retrying on the next frame in case it is still being rendered
export function focusElementById(id: string) {
    const element = document.getElementById(id);
    if (element) {
        element.focus();
        return;
    }

    window.requestAnimationFrame(() => document.getElementById(id)?.focus());
}
