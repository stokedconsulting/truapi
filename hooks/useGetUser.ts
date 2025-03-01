import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { getUser } from "../lib/api"
import { useAuth } from "@clerk/nextjs"

export const useGetUser = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ["getUser", isLoaded, isSignedIn],
        queryFn: async () => getUser((await getToken()) as string),
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
        enabled: !!isSignedIn
    });
}