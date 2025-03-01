'use client';

import type { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base, baseSepolia } from 'viem/chains';
import ReactQueryClientProvider from './ReactQueryClientProvider';
import { ClerkProvider } from '@clerk/nextjs';
import { UserProvider } from '@/contexts/user.context';
import { WagmiProvider } from 'wagmi';
import { useWagmiConfig } from '@/config/wagmi';

export function Providers({ children }: { children: ReactNode }) {
    const wagmiConfig = useWagmiConfig();

    return (
        <ReactQueryClientProvider>
            <WagmiProvider config={wagmiConfig}>
                <OnchainKitProvider
                    apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
                    chain={process.env.NEXT_APP_ENV === "production"
                        ? base
                        : baseSepolia}
                    config={{ appearance: { theme: 'light' } }}
                >
                    <ClerkProvider>
                        <UserProvider>
                            {children}
                        </UserProvider>
                    </ClerkProvider>
                </OnchainKitProvider>
            </WagmiProvider>
        </ReactQueryClientProvider>
    );
}