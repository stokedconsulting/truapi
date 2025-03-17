'use client';

import type { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base, baseSepolia } from 'wagmi/chains';
import { ClerkProvider } from '@clerk/nextjs';
import { UserProvider } from '@/contexts/user.context';

export function Providers({ children }: { children: ReactNode }) {
    return (
        // Wagmi + ReactQuery Providers created by OnchainKitProvider
        <OnchainKitProvider
            apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
            chain={process.env.NEXT_APP_ENV === "production"
                ? base
                : baseSepolia}
            config={{ appearance: { theme: 'light' }, wallet: { display: 'modal' } }}
        >
            <ClerkProvider>
                <UserProvider>
                    {children}
                </UserProvider>
            </ClerkProvider>
        </OnchainKitProvider>
    );
}