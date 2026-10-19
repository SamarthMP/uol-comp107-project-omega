import { getAuthConfig } from "@/lib/auth-client";
import type { ExternalProviderInfo } from "@/lib/auth-types";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface AuthConfigContextValue {
    emailEnabled: boolean;
    providers: ExternalProviderInfo[];
    loading: boolean;
}

const AuthConfigContext = createContext<AuthConfigContextValue>({ emailEnabled: false, providers: [], loading: true });

export function EmailFeatureProvider({ children }: { children: ReactNode }) {
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [providers, setProviders] = useState<ExternalProviderInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAuthConfig()
            .then((res) => {
                setEmailEnabled(res.emailEnabled);
                setProviders(res.providers);
            })
            .catch(() => {
                setEmailEnabled(false);
                setProviders([]);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <AuthConfigContext value={{ emailEnabled, providers, loading }}>
            {children}
        </AuthConfigContext>
    );
}

export function useEmailFeature() {
    const { emailEnabled, loading } = useContext(AuthConfigContext);
    return { emailEnabled, loading };
}

export function useAuthConfig() {
    return useContext(AuthConfigContext);
}
