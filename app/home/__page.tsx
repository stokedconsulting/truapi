"use client"

import { useAppUser } from "@/contexts/user.context";
import { useTransferAsset } from "@/hooks/useTransferAsset";
import { SignOutButton } from "@clerk/nextjs"
import { useState } from "react";
import { useGetTransfers } from "@/hooks/useGetTransfers";
import { useGetBalances } from "@/hooks/useGetBalances";
import { useTradeAsset } from "@/hooks/useTradeAsset";
import { supportedAssets } from "@/config";

// --- NEW HOOKS (adjust import paths/types as needed) ---
import { useCreateInvoice } from "@/hooks/useCreateInvoice";
import { useGetUserInvoices } from "@/hooks/useGetUserInvoices";
import { useCreateCheckoutSession } from "@/hooks/useCreateCheckoutSession";
import { useGetCheckoutSession } from "@/hooks/useGetCheckoutSession";

export default function Page() {
    const { user, isUserLoading } = useAppUser();

    // =========================
    // Existing Transfer Logic
    // =========================
    const [amount, setAmount] = useState<undefined | number>();
    const [address, setAddress] = useState('');
    const [transferAssetName, setTransferAssetName] = useState(
        supportedAssets.includes('usdc') ? 'usdc' : supportedAssets[0]
    );
    const { data: transferResult, isPending, transferAsset } = useTransferAsset(
        address,
        transferAssetName,
        Number(amount)
    );
    const { data: transfersData, isLoading: isTransfersLoading } = useGetTransfers(5, undefined);

    // =========================
    // Existing Balances Logic
    // =========================
    const { data: balances, isLoading: isBalancesLoading } = useGetBalances();

    // =========================
    // Existing Trade Logic
    // =========================
    const defaultFrom = supportedAssets.includes('usdc') ? 'usdc' : supportedAssets[0];
    const defaultTo = supportedAssets.includes('eth') ? 'eth' : supportedAssets[0];
    const [fromAsset, setFromAsset] = useState(defaultFrom);
    const [toAsset, setToAsset] = useState(defaultTo);
    const [tradeAmount, setTradeAmount] = useState<undefined | number>();
    const {
        tradeAsset: executeTrade,
        data: tradeData,
        isPending: isTradePending
    } = useTradeAsset(fromAsset, toAsset, Number(tradeAmount));

    return (
        <div>
            {/* Existing UI */}
            User:  {isUserLoading ? 'Loading...' : user?.name} <br />
            Wallet: {isUserLoading ? 'Loading...' : user?.wallet.address} <br />

            <h3>Balances</h3>
            {isBalancesLoading && <p>Loading balances...</p>}
            {balances && (
                <div>
                    <p>USDC: {balances.usdc}</p>
                    <p>ETH: {balances.eth}</p>
                </div>
            )}

            <h3>Transfer</h3>
            <label>Asset: </label>
            <select
                value={transferAssetName}
                onChange={(e) => setTransferAssetName(e.target.value)}
                disabled={isUserLoading}
            >
                {supportedAssets.map((asset) => (
                    <option key={asset} value={asset}>
                        {asset}
                    </option>
                ))}
            </select>
            <br />
            Recipient: <input
                type="text"
                value={address}
                onChange={(e) => { setAddress(e.target.value) }}
            /> <br />
            Amount: <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(Number(e.target.value) || undefined) }}
            /> <br />
            <button disabled={isPending || isUserLoading} onClick={() => transferAsset()}>
                Transfer
            </button>
            {transferResult && (
                <div>
                    <p>Transaction Link: {transferResult.transactionLink}</p>
                    <p>Status: {transferResult.status}</p>
                </div>
            )}

            <h3>Trade</h3>
            <div style={{ marginBottom: '1rem' }}>
                <label>From: </label>
                <select
                    value={fromAsset}
                    onChange={(e) => setFromAsset(e.target.value)}
                    disabled={isUserLoading}
                >
                    {supportedAssets.map((asset) => (
                        <option key={asset} value={asset}>
                            {asset}
                        </option>
                    ))}
                </select>
                <br />
                <label>To: </label>
                <select
                    value={toAsset}
                    onChange={(e) => setToAsset(e.target.value)}
                    disabled={isUserLoading}
                >
                    {supportedAssets.map((asset) => (
                        <option key={asset} value={asset}>
                            {asset}
                        </option>
                    ))}
                </select>
                <br />
                <label>Amount: </label>
                <input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(Number(e.target.value) || undefined)}
                />
                <br />
                <button
                    disabled={isTradePending || isUserLoading}
                    onClick={() => executeTrade()}
                >
                    Trade
                </button>
            </div>
            {tradeData && (
                <div>
                    <p>Trade ID: {tradeData.tradeId}</p>
                    <p>
                        {tradeData.fromAmount} {tradeData.fromAssetId} →{' '}
                        {tradeData.toAmount} {tradeData.toAssetId}
                    </p>
                    <p>Status: {tradeData.status}</p>
                    <p>Transaction Link: {tradeData.transactionLink}</p>
                </div>
            )}

            <h3>Transfers</h3>
            {isTransfersLoading && <p>Loading transfers...</p>}
            {transfersData && (
                <ul>
                    {transfersData.transfers.map((t: any) => (
                        <li key={t.id}>
                            ID: {t.id}, Amount: {t.amount}, Status: {t.status}
                        </li>
                    ))}
                </ul>
            )}

            <h3>Actions</h3>
            <SignOutButton />

            {/* ================================
                NEW: CREATE/VIEW INVOICES
            ================================ */}
            <CreateAndViewInvoices />

            {/* ================================
                NEW: CREATE/VIEW CHECKOUT SESSION
            ================================ */}
            <CreateAndViewSession />
        </div>
    );
}

// Minimal separate components for the new invoice and checkout session UIs

function CreateAndViewInvoices() {
    const [invoiceName, setInvoiceName] = useState("");
    const [invoiceEmail, setInvoiceEmail] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [paymentCollection, setPaymentCollection] = useState<"one-time" | "multi-use">("one-time");
    const [items, setItems] = useState<Array<{ itemName: string; price: number }>>([
        { itemName: "", price: 0 }
    ]);

    // Hook usage
    const {
        createInvoice,
        isPending: isCreatingInvoice
    } = useCreateInvoice(
        invoiceName,
        invoiceEmail,
        dueDate,
        paymentCollection,
        items
    );
    const { data: userInvoices, isLoading: isInvoicesLoading } = useGetUserInvoices();

    const handleAddItem = () => {
        setItems([...items, { itemName: "", price: 0 }]);
    };

    return (
        <div style={{ marginTop: "2rem" }}>
            <h3>Create Invoice</h3>
            <label>Name: </label>
            <input
                type="text"
                value={invoiceName}
                onChange={(e) => setInvoiceName(e.target.value)}
            />
            <br />
            <label>Email: </label>
            <input
                type="text"
                value={invoiceEmail}
                onChange={(e) => setInvoiceEmail(e.target.value)}
            />
            <br />
            <label>Due Date: </label>
            <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
            />
            <br />
            <label>Payment Collection: </label>
            <select
                value={paymentCollection}
                onChange={(e) =>
                    setPaymentCollection(e.target.value as "one-time" | "multi-use")
                }
            >
                <option value="one-time">One-Time</option>
                <option value="multi-use">Multi-Use</option>
            </select>
            <br />
            <h4>Invoice Items</h4>
            {items.map((it, idx) => (
                <div key={idx} style={{ marginBottom: "0.5rem" }}>
                    <input
                        type="text"
                        placeholder="Item Name"
                        value={it.itemName}
                        onChange={(e) => {
                            const updated = [...items];
                            updated[idx].itemName = e.target.value;
                            setItems(updated);
                        }}
                    />
                    <input
                        type="number"
                        placeholder="Price"
                        value={it.price}
                        onChange={(e) => {
                            const updated = [...items];
                            updated[idx].price = Number(e.target.value) || 0;
                            setItems(updated);
                        }}
                    />
                </div>
            ))}
            <button onClick={handleAddItem}>+ Add Item</button>
            <br />
            <button disabled={isCreatingInvoice} onClick={createInvoice}>
                Create Invoice
            </button>

            <h3>My Invoices</h3>
            {isInvoicesLoading && <p>Loading invoices...</p>}
            {userInvoices && userInvoices.length > 0 && (
                <ul>
                    {userInvoices.map((inv) => (
                        <li key={inv._id}>
                            <h5>#{inv._id} - {inv.name} - {inv.paymentCollection} - {inv.wallet?.address} </h5>
                            Items
                            <ul>
                                {inv.invoiceItems.map((it, idx) => (
                                    <li key={idx}>
                                        {it.itemName} - {it.price}
                                    </li>
                                ))}
                            </ul>
                            Payments
                            <ul>
                                {inv.payments.map((p, idx) => (
                                    <li key={idx}>
                                        {p.name} - {p.email} - {p.amount} - {p.transactionHash}
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function CreateAndViewSession() {
    const [sessionInvoiceId, setSessionInvoiceId] = useState("");
    const [sessionName, setSessionName] = useState("");
    const [sessionEmail, setSessionEmail] = useState("");
    const [viewSessionId, setViewSessionId] = useState("");

    // Hook usage
    const {
        createCheckoutSession,
        isPending: isCreatingSession
    } = useCreateCheckoutSession(sessionInvoiceId, sessionName, sessionEmail);

    const {
        data: sessionData,
        isLoading: isSessionLoading,
        error
    } = useGetCheckoutSession(viewSessionId);

    return (
        <div style={{ marginTop: "2rem" }}>
            <h3>Create Checkout Session</h3>
            <label>Invoice ID: </label>
            <input
                type="text"
                value={sessionInvoiceId}
                onChange={(e) => setSessionInvoiceId(e.target.value)}
            />
            <br />
            <label>Name: </label>
            <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
            />
            <br />
            <label>Email: </label>
            <input
                type="text"
                value={sessionEmail}
                onChange={(e) => setSessionEmail(e.target.value)}
            />
            <br />
            <button disabled={isCreatingSession} onClick={createCheckoutSession}>
                Create Session
            </button>

            <h3>View Checkout Session</h3>
            <label>Session ID: </label>
            <input
                type="text"
                value={viewSessionId}
                onChange={(e) => setViewSessionId(e.target.value)}
            />
            {isSessionLoading && <p>Loading session...</p>}
            {sessionData && (
                <div>
                    <p>Session ID: {sessionData?._id}</p>
                    <p>Invoice ID: {sessionData?.invoiceId._id}</p>
                    <p>Address: {sessionData?.wallet?.address}</p>
                </div>
            )}
            {error && <p>Error: {error?.message}</p>}
        </div>
    );
}
