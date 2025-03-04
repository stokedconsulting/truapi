import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { getCheckoutSession } from "../lib/api";

export const useGetCheckoutSession = (checkoutSessionId: string) => {
    return useQuery({
        queryKey: ["getCheckoutSession", checkoutSessionId],
        queryFn: async () => {
            return getCheckoutSession(checkoutSessionId);
        },
        refetchOnWindowFocus: true,
        refetchInterval: 20 * 1000,
        enabled: !!checkoutSessionId,
    });
};
