/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import i18n from "@/lib/i18n";
import { useEffect, useState } from "react";

export default function useQuery<T>(queryFn: () => Promise<T>, dependencies: any[] = [], defaultValue: T | null = null, callback?: (result: T) => any) {
    const [data, setData] = useState<T | null>(defaultValue);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [nonce, setNonce] = useState<number>(0);

    useEffect(() => {
        setLoading(true);
        queryFn()
            .then((result) => {
                if ((result as any)?.error) {
                    throw new Error((result as any).error);
                }
                callback?.(result);
                setError(null);
                setData(result);
            })
            .catch((error: Error) => {
                console.error("[useQuery]: ", error);
                setError(error.message || i18n.t("common.unknownError"));
                setData(defaultValue);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [callback, defaultValue, dependencies, nonce, queryFn]);

    const refetch = () => setNonce((n) => n + 1);

    return { data, loading, error, refetch };
}