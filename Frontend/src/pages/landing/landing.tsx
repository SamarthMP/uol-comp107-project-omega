import useQuery from "@/hooks/use-query";
import { getApiRootEndpoint } from "@/lib/api";
import { translateBackendMessage } from "@/lib/backend-error";
import routes from "@/lib/routes";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "../../components/ui/button";

export default function Landing() {
    const { t } = useTranslation();


    // Example of fetching data from the backend
    const pingResult = useQuery(
        () => fetch(getApiRootEndpoint() + "/status/ping").then((res) => res.text()),
        [],
        t("landing.pinging")
    );

    return (
        <>
            <div className="flex w-full h-full justify-center items-center flex-col">
                <h1>{t("landing.heading")}</h1>
                <Link to={routes.MAIN}>
                    <Button size="lg">{translateBackendMessage(pingResult.data ?? "")} {t("landing.goToDashboard")}</Button>
                </Link>
            </div>
        </>
    );
}