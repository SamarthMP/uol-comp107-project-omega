import {
    clearSession,
    clearTokens,
    getMe,
    getStoredToken,
    getStoredUser,
    isSessionExpiredError,
    storeUser,
} from "@/lib/auth-client";
import type { UserProfile } from "@/lib/auth-types";
import routes from "@/lib/routes";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

interface AuthContextValue {
    user: UserProfile | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(() => getStoredUser());
    const [loading, setLoading] = useState(() => Boolean(getStoredToken()) && !getStoredUser());

    const refreshUser = useCallback(async () => {
        if (!getStoredToken()) {
            setUser(null);
            setLoading(false);
            return;
        }
        try {
            const profile = await getMe();
            storeUser(profile);
            setUser(profile);
        } catch (error) {
            if (isSessionExpiredError(error)) {
                setUser(null);
                clearTokens();
            } else {
                const cachedUser = getStoredUser();
                if (cachedUser) {
                    setUser(cachedUser);
                }
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const signOut = useCallback(() => {
        clearSession().then(() => {
            clearTokens();
            setUser(null);
            window.location.href = routes.LANDING; // Redirect to home page after logout
        });
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    return (
        <AuthContext.Provider value={{ user, loading, refreshUser, signOut: signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
