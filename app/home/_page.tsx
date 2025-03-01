"use client"

import { useAppUser } from "@/contexts/user.context";
import { useTransferAsset } from "@/hooks/useTransferAsset";
import { SignOutButton } from "@clerk/nextjs"
import { useState } from "react";
import { useGetTransfers } from "@/hooks/useGetTransfers";
import { useGetBalances } from "@/hooks/useGetBalances";
import { useTradeAsset } from "@/hooks/useTradeAsset";
// Import supported assets from your config
import { supportedAssets } from "@/config";

export default function Page() {
    const { user, isUserLoading } = useAppUser();

    // Transfer states
    const [amount, setAmount] = useState<undefined | number>();
    const [address, setAddress] = useState('');

    // 1) Use a piece of state for the transfer asset, default to "usdc" or first in array
    const [transferAssetName, setTransferAssetName] = useState(supportedAssets.includes('usdc') ? 'usdc' : supportedAssets[0]);

    // Use the selected asset instead of a hardcoded string
    const { data: transferResult, isPending, transferAsset } = useTransferAsset(
        address,
        transferAssetName,
        Number(amount)
    );

    // Query for transfers (unchanged)
    const { data: transfersData, isLoading: isTransfersLoading } = useGetTransfers(5, undefined);

    // Query for balances (unchanged)
    const { data: balances, isLoading: isBalancesLoading } = useGetBalances();

    // 2) Trade states (use "usdc" -> "eth" if both exist, else pick from the array)
    const defaultFrom = supportedAssets.includes('usdc') ? 'usdc' : supportedAssets[0];
    const defaultTo = supportedAssets.includes('eth') ? 'eth' : supportedAssets[0];
    const [fromAsset, setFromAsset] = useState(defaultFrom);
    const [toAsset, setToAsset] = useState(defaultTo);
    const [tradeAmount, setTradeAmount] = useState<undefined | number>();

    // Use the trade hook
    const {
        tradeAsset: executeTrade,
        data: tradeData,
        isPending: isTradePending
    } = useTradeAsset(fromAsset, toAsset, Number(tradeAmount));

    return (
        <div>
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
            {/* Dropdown for selecting the transfer asset from supportedAssets */}
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

            {/* Trade UI */}
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

            {/* Show trade result if any */}
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
        </div>
    );
}
