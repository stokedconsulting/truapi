import { useQuery } from "@tanstack/react-query"
import { checkInvoicePayment } from "../lib/api"

export const useCheckInvoicePayment = (invoiceId?: string, checkoutId?: string, enabled = true) => {
    return useQuery({
        queryKey: ["checkInvoicePayment"],
        queryFn: async () => checkInvoicePayment(invoiceId, checkoutId),
        refetchOnWindowFocus: false,
        refetchInterval: 1 * (60 * 1000),
        enabled: (!!invoiceId || !!checkoutId) && enabled
    })
}