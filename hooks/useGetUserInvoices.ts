import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { getUserInvoices } from "../lib/api";

export const useGetUserInvoices = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ["getUserInvoices"],
        queryFn: async () => {
            const token = (await getToken()) as string;
            return getUserInvoices(token);
        },
        refetchOnWindowFocus: false,
        refetchInterval: 10000,
        enabled: !!isSignedIn && !!isLoaded
    });
};
