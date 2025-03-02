import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-toastify";
import { createInvoice, updateInvoice } from "../lib/api";
import { InvoiceItem } from "@/types/api.types";

export const useCreateInvoice = (
    name: string,
    email: string,
    dueDate: string,
    paymentCollection: "one-time" | "multi-use",
    invoiceItems: InvoiceItem[],
    invoiceId?: string,
) => {
    const queryClient = useQueryClient();
    const { getToken } = useAuth();

    const mutation = useMutation({
        mutationFn: async (isDraft?: boolean) => {
            if (invoiceId)
                return updateInvoice((await getToken()) as string, { name, email, dueDate, paymentCollection, invoiceItems, isDraft, invoiceId });
            else
                return createInvoice((await getToken()) as string, { name, email, dueDate, paymentCollection, invoiceItems, isDraft });
        },
        onSuccess: async () => {
            try {
                await queryClient.invalidateQueries({ queryKey: ["getUserInvoices"] });
            } catch (err) {
                console.error(err);
            }
        }
    });

    const _createInvoice = (isDraft?: boolean) => {
        const _promise = mutation.mutateAsync(isDraft);
        toast.promise(_promise, {
            pending: `${invoiceId ? "Updating" : "Creating"} invoice...`,
            success: `Invoice ${invoiceId ? "updated" : "created"} successfully!`,
            error: `Invoice ${invoiceId ? "updation" : "creation"} failed, please try again.`
        });
    };

    return {
        createInvoice: _createInvoice,
        ...mutation
    };
};
