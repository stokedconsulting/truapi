import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-toastify";
import { createCheckoutSession } from "../lib/api";

export const useCreateCheckoutSession = (invoiceId: string, name: string, email: string) => {
    const mutation = useMutation({
        mutationFn: async () => {
            return createCheckoutSession({ invoiceId, name, email });
        }
    });

    const _createCheckoutSession = () => {
        const _promise = mutation.mutateAsync();
        toast.promise(_promise, {
            pending: "Creating checkout session...",
            success: "Checkout session created!",
            error: "Failed to create checkout session."
        });
    };

    return {
        createCheckoutSession: _createCheckoutSession,
        ...mutation
    };
};
