"use client"

import { useParams } from "next/navigation"
import ErrorPage from 'next/error'
import styles from "./Checkout.module.scss"
import Image from "next/image"
import WalletIcon from "@/src/assets/wallet.svg"
import QRIcon from "@/src/assets/qr.svg"
import { useMemo, useState } from "react"
import { formatNumber } from "@/lib/utils"
import { useAccount } from "wagmi"
import { useAppKit } from '@reown/appkit/react'
import { useErc20Transfer } from "@/hooks/useErc20Transfer"
import { tokenAddresses } from "@/config"
import { QRCodeSVG } from 'qrcode.react';
import { base, baseSepolia } from "viem/chains"
import { useGetCheckoutSession } from "@/hooks/useGetCheckoutSession"
import CountdownTimer from "@/components/CountdownTimer"
import SuccessCheckIcon from "@/src/assets/success-check.svg";
import Skeleton from "react-loading-skeleton"
import { StatusChip } from "@/components/StatusChip"

export default function Page() {
    const { isConnected } = useAccount();
    const { open } = useAppKit();
    const { checkoutId } = useParams<{ checkoutId: string }>();
    const [showQr, setShowQr] = useState(false);

    const { data: checkoutSession, isFetching: isCheckoutFetching, isError: isCheckoutError } = useGetCheckoutSession(checkoutId);
    const invoice = useMemo(() => checkoutSession?.invoiceId, [checkoutSession]);
    const amount = useMemo(() => invoice?.invoiceItems.reduce((sum, val) => sum + val.price, 0), [invoice]);
    const { transferErc20, isPending: isTransferPending } = useErc20Transfer(
        (process.env.NEXT_APP_ENV == "production" ? tokenAddresses.USDC['base-mainnet'] : tokenAddresses.USDC['base-sepolia']),
        checkoutSession?.wallet?.address || undefined,
        amount,
    );

    if (isCheckoutError)
        return <ErrorPage statusCode={404} title="Checkout Session Not Found" withDarkMode={false} />
    else
        return (
            <div className={styles.main}>
                <Image
                    src="/assets/superpay-logo.svg"
                    alt="SuperPay"
                    width={180}
                    height={180}
                />
                {/* INVOICE DETAILS */}
                <div className={`${styles.container} ${styles.invoice}`}>
                    <div className={styles.header}>
                        <h3>
                            {isCheckoutFetching
                                ? <Skeleton width={250} height={24} />
                                : <>
                                    <span>Invoice </span><span className={styles.value}>#{String(invoice?._id).toUpperCase()}</span>
                                </>}
                        </h3>
                        <div className={styles.amountContainer}>
                            {isCheckoutFetching
                                ? <Skeleton width={100} />
                                : <span className={styles.amount}>{formatNumber(amount)} USDC</span>}
                            <Image
                                src="/assets/usdc-logo.png"
                                alt="USDC"
                                width={24}
                                height={24}
                            />
                        </div>
                        {isCheckoutFetching
                            ? <Skeleton width={100} />
                            : (invoice?.paymentCollection == "one-time")
                                ? <span className={styles.subtitle}>Due {(new Date(invoice?.dueDate as unknown as string).toLocaleDateString())}</span>
                                : <span className={styles.subtitle}>{(new Date()).toLocaleDateString()}</span>}
                        <div className={styles.expiry}>
                            Checkout expires in:
                            {isCheckoutFetching
                                ? <Skeleton width={50} />
                                : <CountdownTimer targetDate={new Date(checkoutSession?.expiresAt as unknown as string)} />}
                        </div>
                        {checkoutSession && <StatusChip title={checkoutSession.status.toUpperCase()} className={checkoutSession.status} />}
                    </div>
                    <div className={styles.hr} />
                    <table>
                        {/* ONE-TIME INFO */}
                        <tbody>
                            <tr>
                                <td>From</td>
                                <td>
                                    {isCheckoutFetching
                                        ? <Skeleton width={100} />
                                        : String(invoice?.userId.name)}
                                </td>
                            </tr>
                            <tr>
                                <td>To</td>
                                <td>
                                    {isCheckoutFetching
                                        ? <Skeleton width={100} />
                                        : checkoutSession?.name}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                {/* PAYMENT */}
                {
                    checkoutSession?.status == "paid"
                        ? <div className={`${styles.container} ${styles.success}`}>
                            <SuccessCheckIcon />
                        </div>
                        : <div className={`${styles.container} ${styles.payment}`}>
                            <span>Pay with</span>
                            <div className={styles.paymentOption}>
                                {
                                    !showQr
                                        ? <><WalletIcon /> Wallet</>
                                        : <><QRIcon /> QR Code</>
                                }
                            </div>
                            <div className={styles.assetInfoContainer}>
                                <div className={styles.assetInfo}>
                                    <span>Network</span>
                                    <div className={styles.assetBox}>
                                        <Image src={"/assets/base-logo.png"} width={24} height={24} alt="Bitcoin" />
                                        <span>{process.env.NEXT_APP_ENV == "production" ? "Base" : "Base Sepolia"}</span>
                                    </div>
                                </div>
                                <div className={styles.assetInfo}>
                                    <span>Coin</span>
                                    <div className={styles.assetBox}>
                                        <Image src={"/assets/usdc-logo.png"} width={24} height={24} alt="Bitcoin" />
                                        <span>USDC</span>
                                    </div>
                                </div>
                            </div>
                            {!showQr && <button
                                className={styles.primaryBttn}
                                onClick={() => {
                                    isConnected
                                        ? transferErc20()
                                        : open()
                                }}
                                disabled={isCheckoutFetching || isTransferPending}
                            >
                                {isConnected
                                    ? `Pay ${amount} USDC`
                                    : `Connect Wallet`
                                }
                            </button>}
                            <button
                                className={styles.secondaryBttn}
                                disabled={isCheckoutFetching || isTransferPending || !checkoutSession}
                                onClick={() => setShowQr(!showQr)}
                            >
                                {
                                    showQr
                                        ? <><WalletIcon /> Pay by Wallet</>
                                        : <><QRIcon /> Scan QR Code</>
                                }
                            </button>
                            {showQr && <div className={styles.qrContainer}>
                                <QRCodeSVG value={`ethereum:${checkoutSession?.wallet?.address}@${process.env.NEXT_APP_ENV === "production" ? base.id : baseSepolia.id}`} />
                                <div className={styles.addressContainer}>
                                    <span>Address: <input type="text" value={checkoutSession?.wallet?.address || undefined} /></span>
                                </div>
                            </div>}
                        </div>}
            </div >
        )
}