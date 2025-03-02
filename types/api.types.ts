import { CheckoutSessionDocument } from "@/models/CheckoutSession.model";
import { InvoiceDocument } from "@/models/Invoice.model";

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

export type GetUserInvoicesResponse = InvoiceDocument[];

export type CreateCheckoutSessionRequest = {
    invoiceId: string
    name: string,
    email: string
}

export type CreateCheckoutSessionResponse = CheckoutSessionDocument;

export type GetCheckoutSessionResponse = CheckoutSessionDocument & { invoiceId: InvoiceDocument };