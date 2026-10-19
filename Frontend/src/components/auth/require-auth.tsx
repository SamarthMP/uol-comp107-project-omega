import { useAuth } from "@/hooks/use-auth";
import routes from "@/lib/routes";
import { Navigate, useLocation } from "react-router";
import { Spinner } from "../ui/spinner";

export interface ReturnLocationState {
    from?: string;
}

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex w-full h-full justify-center items-center">
                <div className="animate-pulse text-muted-foreground"><Spinner /></div>
            </div>
        );
    }

    if (!user) {
        const state: ReturnLocationState = { from: `${location.pathname}${location.search}` };
        return <Navigate to={routes.SIGN_IN} replace state={state} />;
    }

    return <>{children}</>;
}
