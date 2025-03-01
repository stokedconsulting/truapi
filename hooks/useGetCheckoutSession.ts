import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { getCheckoutSession } from "../lib/api";

export const useGetCheckoutSession = (checkoutSessionId: string) => {
    // @todo - remove token requirement
    const { getToken, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ["getCheckoutSession", checkoutSessionId],
        queryFn: async () => {
            return getCheckoutSession((await getToken()) as string, checkoutSessionId);
        },
        refetchOnWindowFocus: false,
        enabled: !!checkoutSessionId && !!isSignedIn,
    });
};
