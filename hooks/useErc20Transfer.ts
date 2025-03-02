import { toast } from "react-toastify";
import { useWriteContract, useReadContracts } from "wagmi"
import { erc20Abi, parseUnits } from "viem"

export const useErc20Transfer = (token: string, to?: string, amount?: number) => {
    const mutation = useWriteContract();

    const { data: tokenMetadata } = useReadContracts({
        contracts: [
            {
                address: token as `0x${string}`,
                abi: erc20Abi,
                functionName: 'decimals'
            }
        ],
        query: {
            enabled: !!token
        }
    });

    const transferErc20 = () => {
        // @todo - handle error toast
        if (!tokenMetadata || !tokenMetadata[0].result || !to || !amount) return;

        const _promise = mutation.writeContractAsync({
            abi: erc20Abi,
            address: token as `0x${string}`,
            functionName: 'transfer',
            args: [
                to as `0x${string}`,
                parseUnits(amount.toString(), tokenMetadata[0].result)
            ],
        });

        toast.promise(_promise, {
            pending: "Transfering...",
            success: "Transfer successful!",
            error: "Transfer failed, please try again!"
        })
    }

    return {
        ...mutation,
        transferErc20
    }
}