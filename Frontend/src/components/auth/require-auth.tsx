import { useAuth } from "@/hooks/use-auth";
import routes from "@/lib/routes";
import { Navigate } from "react-router";
import { Spinner } from "../ui/spinner";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex w-full h-full justify-center items-center">
                <div className="animate-pulse text-muted-foreground"><Spinner /></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to={routes.SIGN_IN} replace />;
    }

    return <>{children}</>;
}
