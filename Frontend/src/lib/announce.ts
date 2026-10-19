// A single, always-present polite live region. Screen readers don't reliably announce
// live regions that are inserted already containing text, so status messages are
// copied into this region instead.

const ANNOUNCE_DELAY_MS = 300;

let region: HTMLElement | null = null;
let pending: number | undefined;

function getRegion() {
    if (!region) {
        region = document.createElement("div");
        region.setAttribute("role", "status");
        region.setAttribute("aria-live", "polite");
        region.setAttribute("aria-atomic", "true");
        region.className = "sr-only";
        document.body.appendChild(region);
    }
    return region;
}

// The short delay lets focus changes (and any closing dialog) settle first,
// and clearing beforehand means repeating the same message is still announced
export function announce(message: string) {
    const target = getRegion();
    target.textContent = "";
    window.clearTimeout(pending);
    pending = window.setTimeout(() => {
        target.textContent = message;
    }, ANNOUNCE_DELAY_MS);
}
