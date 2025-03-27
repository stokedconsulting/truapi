"use client"

import { useAppUser } from "@/contexts/user.context";
import styles from "./Trade.module.scss";
import { useGetCoreTokenPrices } from "@/hooks/useGetCoreTokenPrices";
import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/utils";
import Dropdown, { OptionType } from "@/components/Dropdown";
import { useTradeAsset } from "@/hooks/useTradeAsset";
import { DevelopmentBlocker } from "@/components/DevelopmentBlocker";

// @todo - Skeleton Loaders

export default function Page() {
    const { balances } = useAppUser();
    const { prices } = useGetCoreTokenPrices();

    const tokens = [
        {
            imageUrl: '/assets/usdc-logo.png',
            symbol: 'USDC',
            priceKey: 'usdc'
        },
        {
            imageUrl: '/assets/ethereum-logo.png',
            symbol: 'ETH',
            priceKey: 'eth',
        },
        {
            imageUrl: '/assets/cb-ethereum-logo.png',
            symbol: 'cbETH',
            priceKey: 'eth',
        },
        {
            imageUrl: '/assets/cb-bitcoin-logo.png',
            symbol: 'cbBTC',
            priceKey: 'btc',
        },
    ]

    const [fromToken, setFromToken] = useState(tokens[0]);
    const [toToken, setToToken] = useState(tokens[1]);
    const [amountOut, setAmountOut] = useState(0);
    const [amountIn, setAmountIn] = useState(0);

    const { tradeAsset, isPending } = useTradeAsset(fromToken.symbol, toToken.symbol, amountOut);

    const handleAmountOutChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setAmountOut(Number(value));
    }

    const handleFromTokenSelection = (option: OptionType) => {
        setFromToken(tokens.filter((token) => token.symbol == option.name)[0]);
    }

    const handleToTokenSelection = (option: OptionType) => {
        setToToken(tokens.filter((token) => token.symbol == option.name)[0]);
    }

    useEffect(() => {
        if (prices && prices[fromToken.priceKey] && prices[toToken.priceKey]) {
            const usdValue = prices[fromToken.priceKey] * amountOut;
            const nextAmountIn = usdValue / prices[toToken.priceKey];
            setAmountIn(nextAmountIn);
        } else {
            setAmountIn(0);
        }
    }, [amountOut, fromToken, toToken, prices]);

    return (
        <div className={styles.main}>
            <DevelopmentBlocker pageName="Trade" />
            <div className={styles.container}>
                {/* TRADE OUT */}
                <div className={styles.selectionContainer}>
                    <div className={styles.left}>
                        <span className={styles.title}>You send</span>
                        <input type="number" value={amountOut} onChange={handleAmountOutChange} step={0.00001} disabled={isPending} />
                        <div className={styles.valueContainer}>
                            <span className={styles.subtitle}>${(prices && prices[fromToken.priceKey]) ? prices[fromToken.priceKey] * amountOut : "NA"}</span>
                            <span className={styles.subtitle}>1 {fromToken.symbol} = ${prices && prices[fromToken.priceKey] ? formatNumber(prices[fromToken.priceKey]) : "NA"}</span>
                        </div>
                    </div>
                    <div className={styles.right}>
                        <Dropdown
                            options={tokens.map((token) => ({ "icon": token.imageUrl, "name": token.symbol }))}
                            selected={{ icon: fromToken.imageUrl, name: fromToken.symbol }}
                            onChange={handleFromTokenSelection}
                        />
                        <div className={styles.balanceContainer}>
                            <span className={styles.key}>Balance:</span>
                            <span className={styles.value}>{balances ? formatNumber(balances[fromToken.symbol.toLowerCase()]) : 'NA'}</span>
                        </div>
                    </div>
                </div>
                {/* TRADE IN */}
                <div className={`${styles.selectionContainer} ${styles.tradeIn}`}>
                    <div className={styles.left}>
                        <span className={styles.title}>You receive</span>
                        <input type="number" value={amountIn} step={0.00001} disabled />
                        <div className={styles.valueContainer}>
                            <span className={styles.subtitle}>${prices && prices[toToken.priceKey] ? prices[toToken.priceKey] * amountIn : "NA"}</span>
                            <span className={styles.subtitle}>1 {toToken.symbol} = ${prices && prices[toToken.priceKey] ? formatNumber(prices[toToken.priceKey]) : "NA"}</span>
                        </div>
                    </div>
                    <div className={styles.right}>
                        <Dropdown
                            options={tokens.map((token) => ({ "icon": token.imageUrl, "name": token.symbol }))}
                            selected={{ icon: toToken.imageUrl, name: toToken.symbol }}
                            onChange={handleToTokenSelection}
                        />
                        <div className={styles.balanceContainer}>
                            <span className={styles.key}>Balance:</span>
                            <span className={styles.value}>{balances ? formatNumber(balances[toToken.symbol.toLowerCase()]) : 'NA'}</span>
                        </div>
                    </div>
                </div>
                <button className={styles.primaryBttn} disabled={isPending} onClick={tradeAsset}>
                    {isPending ? "Loading" : "Trade"}
                </button>
            </div>
        </div>
    );
}