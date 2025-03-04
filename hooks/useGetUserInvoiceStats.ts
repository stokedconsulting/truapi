import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { getUserInvoiceStats } from "../lib/api";

export const useGetUserInvoicesStats = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ["getUserInvoicesStats"],
        queryFn: async () => {
            const token = (await getToken()) as string;
            return getUserInvoiceStats(token);
        },
        refetchOnWindowFocus: false,
        enabled: !!isLoaded && !!isSignedIn
    });
};
