import { toast } from "react-toastify";
import { useWriteContract, useReadContracts } from "wagmi"
import { ContractFunctionParameters, erc20Abi, parseUnits } from "viem"
import { useMemo } from "react";

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

    const config: ContractFunctionParameters | null = useMemo(() => {
        if (!tokenMetadata || !tokenMetadata[0].result || !to || !amount) return null;

        return {
            abi: erc20Abi,
            address: token as `0x${string}`,
            functionName: 'transfer',
            args: [
                to as `0x${string}`,
                parseUnits(amount.toString(), tokenMetadata[0].result)
            ],
        }
    }, [token, to, amount, tokenMetadata])

    const transferErc20 = () => {
        // @todo - handle error toast
        if (!config) return;

        const _promise = mutation.writeContractAsync(config as any);

        toast.promise(_promise, {
            pending: "Transfering...",
            success: "Transfer successful!",
            error: "Transfer failed, please try again!"
        })
    }

    return {
        ...mutation,
        transferErc20,
        transferErc20Config: config
    }
}