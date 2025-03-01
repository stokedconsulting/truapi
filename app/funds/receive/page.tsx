"use client"

import { useAppUser } from "@/contexts/user.context";
import styles from "./Receive.module.scss";
import { QRCodeSVG } from 'qrcode.react';
import { base, baseSepolia } from "viem/chains";
import Image from "next/image";
import { useMemo } from "react";
import { useGetCoreTokenPrices } from "@/hooks/useGetCoreTokenPrices";
import { formatNumber } from "@/lib/utils";

export default function Page() {
    const { user, balances } = useAppUser();
    const { prices } = useGetCoreTokenPrices();

    const tokens = useMemo(() => [
        {
            imageUrl: '/assets/usdc-logo.png',
            symbol: 'USDC',
            price: prices?.usdc,
            balance: balances?.usdc,
            value: formatNumber((prices?.usdc || 0) * (balances?.usdc || 0))
        },
        {
            imageUrl: '/assets/ethereum-logo.png',
            symbol: 'ETH',
            price: prices?.eth,
            balance: balances?.eth,
            value: formatNumber((prices?.eth || 0) * (balances?.eth || 0))
        },
        {
            imageUrl: '/assets/cb-ethereum-logo.png',
            symbol: 'cbETH',
            price: prices?.eth,
            balance: balances?.cbeth,
            value: formatNumber((prices?.eth || 0) * (balances?.cbeth || 0))
        },
        {
            imageUrl: '/assets/cb-bitcoin-logo.png',
            symbol: 'cbBTC',
            price: prices?.btc,
            balance: balances?.cbbtc,
            value: formatNumber((prices?.btc || 0) * (balances?.cbbtc || 0))
        },
    ], [balances, prices])

    return (
        <div className={styles.main}>
            <div className={styles.qrContainer}>
                <QRCodeSVG value={`ethereum:${user?.wallet.address}@${process.env.NEXT_APP_ENV === "production" ? base.id : baseSepolia.id}`} />
                <div className={styles.hr} />
                <span>Scan QR Code if sending funds from another wallet</span>
            </div>
            <div className={styles.portfolio}>
                <h3>My Portfolio</h3>
                <div className={styles.tokens}>
                    {tokens.map((token, index) => {
                        return <div className={styles.token}>
                            <div className={styles.tokenInfoContainer}>
                                {/* IMG */}
                                <div className={styles.tokenImg}>
                                    <Image src={token.imageUrl} height={24} width={24} alt={token.symbol} />
                                </div>
                                {/* INFO */}
                                <div className={styles.tokenCol}>
                                    <span className={styles.title}>{token.symbol}</span>
                                    <span className={styles.subtitle}>${formatNumber(token.price)}</span>
                                </div>
                            </div>
                            {/* BALANCE */}
                            <div className={`${styles.tokenCol} ${styles.balance}`}>
                                <span className={styles.title}>{formatNumber(token.balance) || 0} {token.symbol}</span>
                                <span className={styles.subtitle}>${token.value || 0}</span>
                            </div>
                        </div>
                    })}

                </div>
            </div>
        </div>
    );
}