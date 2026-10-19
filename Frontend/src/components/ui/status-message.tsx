import { translateBackendError } from "@/lib/backend-error";
import type { StatusType } from "@/lib/use-status.tracker";
import { IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "./alert";


export interface ResponseStatusMessageProps {
    error?: string; // If only error is passed, then the remaining props will be inferred
    status?: StatusType;
    title?: string;
    message?: string;
}

// Status message component. Automatically handles null values to not display anything. 
// You can pass either an error string, or a status, title and description. 
export default function StatusMessage(props: ResponseStatusMessageProps) {

    const displayProps = { ...props };
    const { t } = useTranslation();

    if (displayProps.error) {
        displayProps.status = "error";
        displayProps.title = t("errors.somethingWentWrong");
        displayProps.message = translateBackendError(displayProps.error);
    }

    if (!displayProps.title && !displayProps.message) {
        return; // Don't render anything if there's nothing to show
    }

    return (
        <Alert variant={displayProps.status === "error" ? "destructive" : "default"}>
            {
                displayProps.status === "error" ? (<IconAlertTriangle />) : (<IconInfoCircle />)
            }

            { displayProps.title && <AlertTitle>{displayProps.title}</AlertTitle> }

            <AlertDescription>
                {displayProps.message}
            </AlertDescription>
        </Alert>
    );
}