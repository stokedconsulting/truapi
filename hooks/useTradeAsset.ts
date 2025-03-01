import { useMutation, useQueryClient } from "@tanstack/react-query"
import { tradeAsset } from "../lib/api"
import { useAuth } from "@clerk/nextjs"
import { toast } from "react-toastify";

export const useTradeAsset = (fromAsset: string, toAsset: string, amount: number) => {
    const queryClient = useQueryClient();
    const { getToken } = useAuth();

    const mutation = useMutation({
        mutationFn: async () =>
            tradeAsset((await getToken()) as string, { fromAsset, toAsset, amount }),
        onSuccess: async () => {
            try {
                await queryClient.invalidateQueries({ queryKey: ['getBalances'] })
            } catch (err) {
                console.error(err);
            }
        }
    });

    const _tradeAsset = () => {
        const _promise = mutation.mutateAsync();
        toast.promise(_promise, {
            pending: "Trading...",
            success: "Trade successful!",
            error: "Trade failed, please check amount and try again!"
        })
    }

    return {
        tradeAsset: _tradeAsset,
        ...mutation
    }
}