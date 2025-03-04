import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { getUserActivity } from "../lib/api"
import { useAuth } from "@clerk/nextjs"
import { ActivityTimeFilter } from "@/types/api.types";

export const useGetUserActivity = (timeFilter?: ActivityTimeFilter) => {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ["getUserActivity", isLoaded, isSignedIn, timeFilter],
        queryFn: async () => getUserActivity((await getToken()) as string, timeFilter),
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
        enabled: !!isSignedIn && !!isLoaded
    });
}