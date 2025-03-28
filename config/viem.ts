import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";

export const viemClient = createPublicClient({
    chain: process.env.NEXT_PUBLIC_APP_ENV === "production" ? base : baseSepolia,
    transport: http()
});
