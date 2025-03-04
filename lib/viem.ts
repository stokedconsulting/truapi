// lib/fetchTxTimestamp.ts
import { viemClient } from "../config/viem";

export async function fetchTxTimestamp(txHash: string): Promise<Date | null> {
    try {
        const receipt = await viemClient.getTransactionReceipt({
            hash: txHash as `0x${string}`
        });
        if (!receipt || !receipt.blockNumber) {
            return null;
        }

        const block = await viemClient.getBlock({
            blockNumber: receipt.blockNumber
        });
        if (!block || typeof block.timestamp !== "number") {
            return null;
        }

        return new Date(block.timestamp * 1000);
    } catch (err) {
        console.error("Failed to fetch transaction timestamp:", err);
        return null;
    }
}
