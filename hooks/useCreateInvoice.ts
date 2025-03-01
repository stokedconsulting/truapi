import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-toastify";
import { createInvoice } from "../lib/api";

export const useCreateInvoice = (
    name: string,
    email: string,
    dueDate: string,
    paymentCollection: "one-time" | "multi-use",
    invoiceItems: Array<{ itemName: string; price: number }>
) => {
    const queryClient = useQueryClient();
    const { getToken } = useAuth();

    const mutation = useMutation({
        mutationFn: async () => {
            return createInvoice((await getToken()) as string, { name, email, dueDate, paymentCollection, invoiceItems });
        },
        onSuccess: async () => {
            try {
                await queryClient.invalidateQueries({ queryKey: ["getUserInvoices"] });
            } catch (err) {
                console.error(err);
            }
        }
    });

    const _createInvoice = () => {
        const _promise = mutation.mutateAsync();
        toast.promise(_promise, {
            pending: "Creating invoice...",
            success: "Invoice created successfully!",
            error: "Invoice creation failed, please try again."
        });
    };

    return {
        createInvoice: _createInvoice,
        ...mutation
    };
};
