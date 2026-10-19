import useTheme from "@/hooks/use-theme";
import { IconAlertOctagon, IconAlertTriangle, IconCircleCheck, IconInfoCircle, IconLoader } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
    const { getTheme } = useTheme();
    const { t } = useTranslation();

    return (
        <Sonner
            theme={getTheme()}
            className="toaster group"
            containerAriaLabel={t("toasts.label")}
            icons={{
                success: <IconCircleCheck className="size-4" />,
                info: <IconInfoCircle className="size-4" />,
                warning: <IconAlertTriangle className="size-4" />,
                error: <IconAlertOctagon className="size-4" />,
                loading: <IconLoader className="size-4 animate-spin" />,
            }}
            style={
                {
                    "--normal-bg": "var(--popover)",
                    "--normal-text": "var(--popover-foreground)",
                    "--normal-border": "var(--border)",
                    "--border-radius": "var(--radius)",
                } as React.CSSProperties
            }
            toastOptions={{
                closeButtonAriaLabel: t("toasts.close"),
                classNames: {
                    toast: "cn-toast text-sm! shadow-none!",
                    title: "text-sm! font-semibold! wrap-anywhere",
                    description: "text-sm! text-muted-foreground! wrap-anywhere",
                    actionButton: "h-8! px-3! text-sm! font-semibold! bg-primary! text-primary-foreground!",
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
