import { useMutation, useQueryClient } from "@tanstack/react-query"
import { transferAsset } from "../lib/api"
import { useAuth } from "@clerk/nextjs"
import { toast } from "react-toastify";

export const useTransferAsset = (recipient: string, asset: string, amount: number) => {
    const queryClient = useQueryClient();
    const { getToken } = useAuth();

    const mutation = useMutation({
        mutationFn: async () =>
            transferAsset((await getToken()) as string, { asset, recipient, amount }),
        onSuccess: async () => {
            try {
                await queryClient.invalidateQueries({ queryKey: ['getBalances'] })
            } catch (err) {
                console.error(err);
            }
        }
    });

    const _transferAsset = () => {
        const _promise = mutation.mutateAsync();
        toast.promise(_promise, {
            pending: "Sending...",
            success: "Transfer successful!",
            error: "Transfer failed, please check history or try again!"
        })
    }

    return {
        transferAsset: _transferAsset,
        ...mutation
    }
}