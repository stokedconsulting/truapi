import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { getOnrampBuyUrl } from "../lib/api"
import { useAuth } from "@clerk/nextjs"

export const useGetOnrampBuyUrl = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ["getOnrampBuyUrl", isLoaded, isSignedIn],
        queryFn: async () => getOnrampBuyUrl((await getToken()) as string),
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
        enabled: !!isSignedIn && !!isLoaded
    });
}