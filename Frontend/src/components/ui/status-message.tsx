import { announce } from "@/lib/announce";
import { translateBackendError } from "@/lib/backend-error";
import type { StatusType } from "@/lib/use-status.tracker";
import { cn } from "@/lib/utils";
import { IconAlertTriangle, IconCircleCheck, IconInfoCircle } from "@tabler/icons-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "./alert";


export interface ResponseStatusMessageProps {
    error?: string; // If only error is passed, then the remaining props will be inferred
    status?: StatusType;
    title?: string;
    message?: string;
    className?: string;
}

// Status message component. Automatically handles null values to not display anything.
// You can pass either an error string, or a status, title and description.
// Errors use role="alert"; other messages are sent to the shared live region so saved outcomes are announced.
export default function StatusMessage(props: ResponseStatusMessageProps) {

    const displayProps = { ...props };
    const { t } = useTranslation();

    if (displayProps.error) {
        displayProps.status = "error";
        displayProps.title = t("errors.somethingWentWrong");
        displayProps.message = translateBackendError(displayProps.error);
    }

    const isError = displayProps.status === "error";
    const isSuccess = displayProps.status === "success";
    const spokenText = [displayProps.title, displayProps.message].filter(Boolean).join(". ");

    useEffect(() => {
        if (!isError && spokenText) {
            announce(spokenText);
        }
    }, [isError, spokenText]);

    if (!displayProps.title && !displayProps.message) {
        return; // Don't render anything if there's nothing to show
    }

    return (
        <Alert
            variant={isError ? "destructive" : "default"}
            role={isError ? "alert" : undefined}
            className={cn(
                "sp-rise-in",
                isError && "border-destructive/40",
                isSuccess && "border-success/40 bg-success/10 text-success",
                displayProps.className
            )}
        >
            {
                isError ? (<IconAlertTriangle />) : isSuccess ? (<IconCircleCheck />) : (<IconInfoCircle />)
            }

            { displayProps.title && <AlertTitle className="font-semibold">{displayProps.title}</AlertTitle> }

            {displayProps.message && (
                <AlertDescription className={cn(isError && "text-destructive", isSuccess && "text-foreground")}>
                    {displayProps.message}
                </AlertDescription>
            )}
        </Alert>
    );
}
