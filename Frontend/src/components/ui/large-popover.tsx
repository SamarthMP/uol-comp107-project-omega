// This component is basically a wrapper around both popover and drawer that will switch based on the screen size.
// On desktop show a popover, and on mobile show a drawer.

import * as React from "react";

import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "./drawer";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "./popover";

function shouldUseDrawer() {
    return window.innerWidth < 640; // Use drawer for screens smaller than 640px (Tailwind's sm breakpoint)
}


function LargePopover({ ...props }: React.ComponentProps<typeof Popover>) {
    const Primitive = shouldUseDrawer() ? Drawer : Popover;
    return <Primitive {...props} />;
}

function LargePopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverTrigger>) {
    const Primitive = shouldUseDrawer() ? DrawerTrigger : PopoverTrigger;
    return <Primitive data-slot="popover-trigger" {...props} />;
}

function LargePopoverContent({
    ...props
}: React.ComponentProps<typeof PopoverContent>) {
    const Primitive = shouldUseDrawer() ? DrawerContent : PopoverContent;
    return <Primitive {...props} />;
}


function LargePopoverHeader({  ...props }: React.ComponentProps<"div">) {
    const Primitive = shouldUseDrawer() ? DrawerHeader : PopoverHeader;
    return <Primitive {...props} />;
}

function LargePopoverTitle({  ...props }: React.ComponentProps<"h2">) {
    const Primitive = shouldUseDrawer() ? DrawerTitle : PopoverTitle;
    return <Primitive {...props} />;
}

function LargePopoverDescription({
    ...props
}: React.ComponentProps<"p">) {
    const Primitive = shouldUseDrawer() ? DrawerDescription : PopoverDescription;
    return <Primitive {...props} />;
}

export {
    LargePopover,
    LargePopoverContent,
    LargePopoverDescription,
    LargePopoverHeader,
    LargePopoverTitle,
    LargePopoverTrigger
};

