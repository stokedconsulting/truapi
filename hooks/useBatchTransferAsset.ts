import { useMutation, useQueryClient } from "@tanstack/react-query"
import { batchTransferAsset } from "../lib/api"
import { useAuth } from "@clerk/nextjs"
import { toast } from "react-toastify";
import { BatchTransferItem } from "@/types/api.types";

export const useBatchTransferAsset = (data: BatchTransferItem[]) => {
    const queryClient = useQueryClient();
    const { getToken } = useAuth();

    const mutation = useMutation({
        mutationFn: async () =>
            batchTransferAsset((await getToken()) as string, { data }),
        onSuccess: async () => {
            try {
                await queryClient.invalidateQueries({ queryKey: ['getBalances'] })
            } catch (err) {
                console.error(err);
            }
        }
    });

    const _batchTransfer = () => {
        const _promise = mutation.mutateAsync();
        toast.promise(_promise, {
            pending: "Transferring...",
            success: "Transfer successful!",
            error: "Transfer failed, please check history or try again!"
        })
    }

    return {
        batchTransfer: _batchTransfer,
        ...mutation
    }
}