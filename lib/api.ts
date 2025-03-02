import {
    BatchTransferAssetRequest,
    BatchTransferAssetResponse,
    CreateCheckoutSessionRequest,
    CreateCheckoutSessionResponse,
    CreateInvoiceRequest,
    CreateInvoiceResponse,
    GetBalancesResponse,
    GetCheckoutSessionResponse,
    GetTransfersResponse,
    GetUserInvoicesResponse,
    GetUserResponse,
    TradeAssetRequest,
    TradeAssetResponse,
    TransferAssetRequest,
    TransferAssetResponse,
    UpdateInvoiceRequest,
    UpdateInvoiceResponse
} from "../types/api.types";

// ===============================
// USER
// ===============================

async function getUser(token: string): Promise<GetUserResponse> {
    const response = await fetch(`/api/wallet`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch getUser: ${response.statusText}`);
    }

    const data = (await response.json()) as GetUserResponse;
    return data;
}

// ===============================
// ASSETS
// ===============================

async function transferAsset(token: string, data: TransferAssetRequest): Promise<TransferAssetResponse> {
    const response = await fetch(`/api/wallet/transfer`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch transferAsset: ${response.statusText}`);
    }

    const result = (await response.json()) as TransferAssetResponse;
    return result;
}

async function batchTransferAsset(token: string, data: BatchTransferAssetRequest): Promise<BatchTransferAssetResponse> {
    const response = await fetch(`/api/wallet/batch-transfer`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(`Failed to batch transfer: ${response.statusText}`);
    }

    const result = (await response.json()) as BatchTransferAssetResponse;
    return result;
}

async function tradeAsset(token: string, data: TradeAssetRequest): Promise<TradeAssetResponse> {
    const response = await fetch(`/api/wallet/trade`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch transferAsset: ${response.statusText}`);
    }

    const result = (await response.json()) as TradeAssetResponse;
    return result;
}

async function getTransfers(token: string, limit?: number, page?: number): Promise<GetTransfersResponse> {
    const url = new URL(`/api/wallet/transfer`);
    if (limit) url.searchParams.set('limit', limit.toString());
    if (page) url.searchParams.set('page', page.toString());
    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch getTransfers: ${response.statusText}`);
    }

    const data = (await response.json()) as GetTransfersResponse;
    return data;
}

async function getBalances(token: string): Promise<GetBalancesResponse> {
    const response = await fetch(`/api/wallet/balances`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch getTransfers: ${response.statusText}`);
    }

    const data = (await response.json()) as GetBalancesResponse;
    return data;
}

// ===============================
// INVOICES & CHECKOUT SESSIONS
// ===============================
async function createInvoice(token: string, data: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
    const response = await fetch(`/api/invoice`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(`Failed to create invoice: ${response.statusText}`);
    }

    const result = (await response.json()) as CreateInvoiceResponse;
    return result;
}

async function updateInvoice(token: string, data: UpdateInvoiceRequest): Promise<UpdateInvoiceResponse> {
    const response = await fetch(`/api/invoice`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(`Failed to update invoice: ${response.statusText}`);
    }

    const result = (await response.json()) as UpdateInvoiceResponse;
    return result;
}

async function getUserInvoices(token: string, invoiceId?: string): Promise<GetUserInvoicesResponse> {
    const url = new URL(`/api/invoice`, window.location.origin);
    if (invoiceId)
        url.searchParams.set('invoiceId', invoiceId);
    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch get user invoices: ${response.statusText}`);
    }

    const data = (await response.json()) as GetUserInvoicesResponse;
    return data;
}

async function createCheckoutSession(token: string, data: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> {
    const response = await fetch(`/api/invoice/checkout`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(`Failed to create checkout session: ${response.statusText}`);
    }

    const result = (await response.json()) as CreateCheckoutSessionResponse;
    return result;
}

async function getCheckoutSession(token: string, checkoutSessionId: string): Promise<GetCheckoutSessionResponse> {
    // @review - why does this not work without `window.location.origin`?
    const url = new URL(`/api/invoice/checkout`, window.location.origin);
    url.searchParams.set('id', checkoutSessionId);
    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch get checkout session: ${response.statusText}`);
    }

    const data = (await response.json()) as GetCheckoutSessionResponse;
    return data;
}

export {
    getUser,
    transferAsset,
    batchTransferAsset,
    tradeAsset,
    getTransfers,
    getBalances,
    createInvoice,
    updateInvoice,
    getUserInvoices,
    createCheckoutSession,
    getCheckoutSession
};
