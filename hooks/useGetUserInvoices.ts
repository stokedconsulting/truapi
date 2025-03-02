import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { getUserInvoices } from "../lib/api";

export const useGetUserInvoices = (invoiceId?: string | null) => {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ["getUserInvoices"],
        queryFn: async () => {
            const token = (await getToken()) as string;
            return getUserInvoices(token, invoiceId || undefined);
        },
        refetchOnWindowFocus: false,
        enabled: !!isSignedIn && !!isLoaded && invoiceId != null
    });
};
