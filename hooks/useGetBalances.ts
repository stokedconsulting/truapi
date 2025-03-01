import { useQuery } from "@tanstack/react-query"
import { getBalances } from "../lib/api"
import { useAuth } from "@clerk/nextjs"

export const useGetBalances = () => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ["getBalances"],
        queryFn: async () => getBalances((await getToken()) as string),
        refetchInterval: 10000,
        refetchOnWindowFocus: true
    })
}