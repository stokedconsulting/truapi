import { useQuery } from "@tanstack/react-query"
import { getTransfers } from "../lib/api"
import { useAuth } from "@clerk/nextjs"

export const useGetTransfers = (limit?: number, page?: number) => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ["getTransfers"],
        queryFn: async () => getTransfers((await getToken()) as string, limit, page),
        refetchOnWindowFocus: false
    })
}