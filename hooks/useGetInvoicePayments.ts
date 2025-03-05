import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { getInvoicePayments } from "../lib/api";

export const useGetInvoicePayments = (invoiceId: string) => {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ["getInvoicePayments", invoiceId],
        queryFn: async () => {
            const token = (await getToken()) as string;
            return getInvoicePayments(token, invoiceId);
        },
        refetchOnWindowFocus: false,
        enabled: !!invoiceId && !!isLoaded && !!isSignedIn
    });
};
