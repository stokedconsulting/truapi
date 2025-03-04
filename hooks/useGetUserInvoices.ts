import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { getUserInvoices } from "../lib/api";

export const useGetUserInvoices = (invoiceId?: string | null) => {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ["getUserInvoices", invoiceId],
        queryFn: async () => {
            const token = (await getToken()) as string;
            return getUserInvoices(invoiceId ? token : undefined, invoiceId || undefined);
        },
        refetchOnWindowFocus: false,
        refetchInterval: invoiceId ? 20 * 1000 : undefined,
        enabled: !!isLoaded && !!isSignedIn
    });
};
