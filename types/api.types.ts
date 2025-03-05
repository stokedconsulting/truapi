import { CheckoutSessionDocument } from "@/models/CheckoutSession.model";
import { InvoiceDocument, PaymentDocument } from "@/models/Invoice.model";

export type User = {
    userId: string;
    name: string;
    email: string;
    imageUrl: string;
    wallet: {
        usdBalance: number;
        usdcBalance: number | null;
        id: string;
        address: string;
        rewards: {
            amount: number;
            lastUpdated: Date;
        };
    },
    faucet: {
        amount: number,
        lastRequested: Date
    }
}

export type DestinationUser = {
    name: string;
    email: string | undefined;
    imageUrl: string;
    wallet: {
        address: string
    }
}

export type GetUserResponse = User;

export type ActivityTimeFilter = `1d` | `1w` | `1m` | `6m` | `1y`;

export interface TransferActivity {
    type: "transfer";
    timestamp: number;
    amount: number;
    asset?: string;
    status?: string;
    address?: string;
    transactionHash?: string | null;
}

export interface PaymentActivity {
    type: "invoicePayment" | "checkoutPayment";
    timestamp: number;
    amount: number;
    asset?: string;
    status?: string;
    invoiceId?: string;
    transactionHash?: string | null;
    name?: string;
    email?: string;
}

export type GetUserActivityResponse = {
    volume: { name: string, volume: number }[]
    grossVolume: number,
    totalPayments: number,
}

export type GetRecentActivityResponse = {
    activity: Array<TransferActivity | PaymentActivity>,
    hasMore: boolean,
    nextPage: string | null,
}

export type TransferAssetRequest = {
    asset: string,
    recipient: string;
    amount: number;
}

export type TransferAssetResponse = {
    transactionLink: string,
    status: string
}

export type BatchTransferItem = {
    asset: string;
    destination: string;
    amount: string;
}

export type BatchTransferAssetRequest = {
    data: BatchTransferItem[]
}

export type BatchTransferResult = {
    status: "success" | "failed";
    reason?: string;
    transactionLink?: string;
    asset?: string;
}

export type BatchTransferAssetResponse = {
    transferStatus: BatchTransferResult[]
}

export type TradeAssetRequest = {
    fromAsset: string,
    toAsset: string,
    amount: number
}

export type TradeAssetResponse = {
    tradeId: string,
    fromAssetId: string,
    toAssetId: string,
    fromAmount: number,
    toAmount: number,
    status: string,
    transactionLink: string,
}

export type FundWalletRequest = {
    asset: string,
    amount: number
}

export type Transfer = {
    id: string;
    destinationAddress: string;
    destinationUser: User | null;
    assetId: string;
    amount: number;
    transactionLink: string | undefined;
    status: string;
}

export type GetTransfersResponse = {
    transfers: Transfer[]
}

export type GetBalancesResponse = {
    [key: string]: number;
    usdc: number,
    eth: number,
    cbeth: number,
    cbbtc: number
}

export type InvoiceItem = {
    itemName: string,
    price: string
}

export type CreateInvoiceRequest = {
    name: string,
    email: string,
    dueDate: string,
    paymentCollection: "one-time" | "multi-use",
    invoiceItems: InvoiceItem[],
    isDraft?: boolean
}

export type CreateInvoiceResponse = InvoiceDocument;

export type UpdateInvoiceRequest = {
    name: string,
    email: string,
    dueDate: string,
    paymentCollection: "one-time" | "multi-use",
    invoiceItems: InvoiceItem[],
    isDraft?: boolean,
    invoiceId: string
}

export type UpdateInvoiceResponse = InvoiceDocument;

export type GetUserInvoicesResponse = ({
    invoices: (InvoiceDocument & { userId: { name: string } })[],
    totalCount?: number,
});

export type GetUserInvoiceStatsResponse = {
    totalCount?: number,
    draftCount?: number,
    overdueCount?: number,
    outstandingCount?: number,
    paidCount?: number,
    partiallyPaidCount?: number
}

export type CreateCheckoutSessionRequest = {
    invoiceId: string
    name: string,
    email: string
}

export type CreateCheckoutSessionResponse = CheckoutSessionDocument;

export type GetCheckoutSessionResponse = CheckoutSessionDocument & { invoiceId: InvoiceDocument & { userId: { name: string } } };

export type GetInvoicePaymentsResponse = { payments: PaymentDocument[] };