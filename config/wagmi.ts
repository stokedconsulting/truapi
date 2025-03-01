'use client';

import { useMemo } from 'react';
import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

export function useWagmiConfig() {
    const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? '';
    if (!projectId) {
        const providerErrMessage =
            'To connect to all Wallets you need to provide a NEXT_PUBLIC_WC_PROJECT_ID env variable';
        throw new Error(providerErrMessage);
    }

    return useMemo(() => {
        const wagmiConfig = createConfig({
            chains: [base, baseSepolia],
            ssr: true,
            transports: {
                [base.id]: http(),
                [baseSepolia.id]: http(),
            },
        });

        return wagmiConfig;
    }, [projectId]);
}