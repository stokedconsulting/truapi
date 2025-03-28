"use client"

import styles from "./Onramp.module.scss";
import { FundCard } from "@coinbase/onchainkit/fund";
import { DevelopmentBlocker } from "@/components/DevelopmentBlocker";

// export const metadata = {
//     title: "SuperPay | Onramp"
// }

export default function Page() {
    return (
        <div className={styles.main}>
            <DevelopmentBlocker pageName="Onramp" />
            <div className={styles.container}>
                <FundCard
                    assetSymbol="USDC"
                    country="US"
                    currency="USD"
                />
            </div>
        </div>
    );
}