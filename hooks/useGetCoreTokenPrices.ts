import { useQuery } from "@tanstack/react-query";

export type TokenPricesResponse = {
    [key: string]: number,
    usdc: number,
    eth: number,
    btc: number
}

// A simple function to fetch data from the Coinbase endpoint
async function fetchPrices() {
    const response = await fetch("https://api.coinbase.com/v2/prices/usd/spot");
    if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.statusText}`);
    }

    const result = await response.json();
    // result.data is an array like [{ base: "USDC", amount: "...", currency: "USD" }, ...]
    const data = result.data;

    // Find objects for each core token
    const usdcObj = data.find((item: any) => item.base === "USDC");
    const ethObj = data.find((item: any) => item.base === "ETH");
    const btcObj = data.find((item: any) => item.base === "BTC");

    return {
        usdc: usdcObj ? parseFloat(usdcObj.amount) : undefined,
        eth: ethObj ? parseFloat(ethObj.amount) : undefined,
        btc: btcObj ? parseFloat(btcObj.amount) : undefined,
    } as TokenPricesResponse;
}

export const useGetCoreTokenPrices = () => {
    const query = useQuery({ queryKey: ["coreTokenPrices"], queryFn: fetchPrices });
    return {
        prices: query.data,
        ...query
    }
}
