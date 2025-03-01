import Web3Avatar from "@/components/Web3Avatar";
import { User } from "@/types/api.types";
import { base, baseSepolia } from "viem/chains";
import Image from "next/image";

export const txnExplorerLink = (txHash: string) => {
    const chain = process.env.NEXT_APP_ENV == "production" ? base : baseSepolia;
    return `${chain?.blockExplorers?.default.url}/tx/${txHash}`;
}

export const addressExplorerLink = (address: string) => {
    const chain = process.env.NEXT_APP_ENV == "production" ? base : baseSepolia;
    return `${chain?.blockExplorers?.default.url}/address/${address}`;
}

export const getUserImage = (user?: User, address?: string, width = 100, height = 100) => {
    if (user) {
        if (user.imageUrl)
            return <Image src={user.imageUrl} alt="PFP" width={width} height={height} />;
        else
            return <Image src={`https://avatar.iran.liara.run/username?username=${user.name.split(' ').join("+")}`} alt="PFP" width={width} height={height} />
    } else if (address) {
        return <Web3Avatar address={address} />
    } else {
        return ""
    }
}

export const shortAddress = (address: string | undefined, size = 6) => {
    if (address)
        return `${address.slice(0, size)}....${address.slice(-(size - 1))}`
}

export const formatNumber = (number: number | bigint | undefined, maximumFractionDigits = 4) => number ? number.toLocaleString(undefined, { maximumFractionDigits: maximumFractionDigits as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | undefined }) : undefined;