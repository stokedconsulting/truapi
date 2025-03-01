"use client"

import styles from "./Onramp.module.scss";
import { FundCard } from "@coinbase/onchainkit/fund";

// export const metadata = {
//     title: "SuperPay | Onramp"
// }

export default function Page() {
    return (
        <div className={styles.main}>
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