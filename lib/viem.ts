// lib/fetchTxTimestamp.ts
import { viemClient } from "../config/viem";

export async function fetchTxTimestamp(txHash: string): Promise<Date | null> {
    try {
        // Ensure txHash is properly formatted
        if (!txHash.startsWith('0x')) {
            txHash = `0x${txHash}`;
        }

        const receipt = await viemClient.getTransactionReceipt({
            hash: txHash as `0x${string}`
        });
        
        if (!receipt) {
            console.warn(`No receipt found for transaction ${txHash}`);
            return null;
        }

        if (!receipt.blockNumber) {
            console.warn(`No block number found for transaction ${txHash}`);
            return null;
        }

        const block = await viemClient.getBlock({
            blockNumber: receipt.blockNumber
        });

        if (!block) {
            console.warn(`No block found for block number ${receipt.blockNumber}`);
            return null;
        }

        if (typeof block.timestamp !== "bigint") {
            console.warn(`Invalid timestamp in block ${receipt.blockNumber}`);
            return null;
        }

        return new Date(Number(block.timestamp) * 1000);
    } catch (err) {
        console.error(`Failed to fetch transaction timestamp for ${txHash}:`, err);
        return null;
    }
}
