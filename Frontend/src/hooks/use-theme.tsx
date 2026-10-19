import { useCallback, useEffect } from "react";

type ThemePreference = "light" | "dark" | "system";

export default function useTheme() {

    const getTheme = useCallback(() => {
        return (localStorage.getItem("spTheme") || "system") as ThemePreference;
    }, []);

    const refreshTheme = useCallback(() => {
        let theme = getTheme();

        if (!theme || theme === "system") {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            theme = prefersDark ? "dark" : "light";
        }

        if (theme === "light") {
            document.documentElement.classList.remove("dark");
        } else {
            document.documentElement.classList.add("dark");
        }
    }, [getTheme]);

    const setTheme = useCallback((theme: ThemePreference) => {
        if (theme === "system") {
            localStorage.removeItem("spTheme");
        } else {
            localStorage.setItem("spTheme", theme);
        }

        refreshTheme();
    }, [refreshTheme]);

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return;

        const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
    
        const listener = () => {
            refreshTheme();
        };

        mediaQueryList.addEventListener("change", listener);

        refreshTheme();

        return () => mediaQueryList.removeEventListener("change", listener);
    }, [refreshTheme]);


    return { setTheme, getTheme };
}