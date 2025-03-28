import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { getOnrampBuyUrl } from "../lib/api"
import { useAuth } from "@clerk/nextjs"

export const useGetOnrampBuyUrl = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ["getOnrampBuyUrl", isLoaded, isSignedIn],
        queryFn: async () => {
            // In non-production environments, return the internal onramp URL
            if (process.env.NEXT_PUBLIC_APP_ENV !== "production") {
                return { onrampBuyUrl: "/funds/onramp" };
            }
            // In production, fetch the Coinbase onramp URL
            return getOnrampBuyUrl((await getToken()) as string);
        },
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
        enabled: !!isSignedIn && !!isLoaded
    });
}