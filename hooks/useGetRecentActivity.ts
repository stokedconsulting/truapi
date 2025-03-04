import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { getRecentActivity } from "../lib/api"
import { useAuth } from "@clerk/nextjs"

export const useGetRecentActivity = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ["getRecentActivity", isLoaded, isSignedIn],
        queryFn: async () => getRecentActivity((await getToken()) as string),
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
        enabled: !!isSignedIn && !!isLoaded
    });
}