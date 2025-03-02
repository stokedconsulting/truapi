import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base, baseSepolia } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit/react";
import { holesky as _holesky } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID as string;

export const wagmiAdapter = new WagmiAdapter({
    networks: [base, baseSepolia],
    projectId,
    ssr: true
});

createAppKit({
    adapters: [wagmiAdapter],
    networks: [base, baseSepolia],
    projectId,
    themeMode: 'light'
})