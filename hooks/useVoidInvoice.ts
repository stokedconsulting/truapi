import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-toastify";
import { voidInvoice } from "../lib/api";

export const useVoidInvoice = (invoiceId: string) => {
    const queryClient = useQueryClient();
    const { getToken } = useAuth();

    const mutation = useMutation({
        mutationFn: async () => {
            return voidInvoice((await getToken()) as string, invoiceId)
        },
        onSuccess: async () => {
            try {
                await queryClient.invalidateQueries({ queryKey: ["getUserInvoices"] });
            } catch (err) {
                console.error(err);
            }
        }
    });

    const _voidInvoice = (isDraft?: boolean) => {
        const _promise = mutation.mutateAsync();
        toast.promise(_promise, {
            pending: `Updating invoice...`,
            success: `Updated successfully!`,
            error: `Update failed, please try again.`
        });
    };

    return {
        voidInvoice: _voidInvoice,
        ...mutation
    };
};
