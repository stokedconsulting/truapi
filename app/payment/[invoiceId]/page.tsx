"use client"

import { useParams, useRouter } from "next/navigation"
import styles from "./Payment.module.scss"
import Image from "next/image"
import WalletIcon from "@/public/assets/icons/wallet.svg"
import QRIcon from "@/public/assets/icons/qr.svg"
import { useGetUserInvoices } from "@/hooks/useGetUserInvoices"
import { useEffect, useMemo, useState } from "react"
import { formatNumber } from "@/lib/utils"
import { useAccount } from "wagmi"
import { useAppKit } from '@reown/appkit/react'
import { useErc20Transfer } from "@/hooks/useErc20Transfer"
import { tokenAddresses } from "@/config"
import { QRCodeSVG } from 'qrcode.react';
import { base, baseSepolia } from "viem/chains"
import { useCreateCheckoutSession } from "@/hooks/useCreateCheckoutSession"
import SuccessCheckIcon from "@/public/assets/icons/success-check.svg";
import ErrorPage from "next/error"
import Skeleton from "react-loading-skeleton"
import { StatusChip } from "@/components/StatusChip"

export default function Page() {
    const { isConnected } = useAccount();
    const { open } = useAppKit();
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const router = useRouter();
    const [showQr, setShowQr] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const { data, isFetching: isInvoiceFetching, isError: isInvoiceError } = useGetUserInvoices(invoiceId || null);
    const invoice = useMemo(() => data ? data.invoices[0] : undefined, [data]);
    const amount = useMemo(() => invoice?.invoiceItems.reduce((sum, val) => sum + val.price, 0), [invoice]);
    const { transferErc20, isPending: isTransferPending } = useErc20Transfer(
        (process.env.NEXT_APP_ENV == "production" ? tokenAddresses.USDC['base-mainnet'] : tokenAddresses.USDC['base-sepolia']),
        invoice?.wallet?.address || undefined,
        amount,
    );
    const { createCheckoutSession, isPending: isCheckoutPending, isSuccess: isCheckoutSuccess, data: checkoutData } = useCreateCheckoutSession(invoiceId, name, email);

    useEffect(() => {
        if (isCheckoutSuccess && checkoutData)
            router.push(`/payment/checkout/${checkoutData._id}`);
    }, [isCheckoutSuccess, checkoutData])

    if (isInvoiceError)
        return <ErrorPage statusCode={404} title="Invoice Not Found" withDarkMode={false} />
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
                        {isInvoiceFetching
                            ? <Skeleton width={250} height={24} />
                            : <>
                                <span>Invoice </span><span className={styles.value}>#{invoiceId.toUpperCase()}</span>
                            </>}
                    </h3>
                    <div className={styles.amountContainer}>
                        {isInvoiceFetching
                            ? <Skeleton width={100} />
                            : <span className={styles.amount}>{formatNumber(amount)} USDC</span>}
                        <Image
                            src="/assets/usdc-logo.png"
                            alt="USDC"
                            width={24}
                            height={24}
                        />
                    </div>
                    {isInvoiceFetching
                        ? <Skeleton width={100} />
                        : (invoice?.paymentCollection == "one-time")
                            ? <span className={styles.subtitle}>Due {(new Date(invoice?.dueDate as unknown as string).toLocaleDateString())}</span>
                            : <span className={styles.subtitle}>{(new Date()).toLocaleDateString()}</span>}
                    {invoice && <StatusChip title={invoice.status.toUpperCase()} className={invoice.status} />}
                </div>
                <div className={styles.hr} />
                <table>
                    {/* ONE-TIME INFO */}
                    {(invoice?.paymentCollection == "one-time") && <tbody>
                        <tr>
                            <td>From</td>
                            <td>
                                {isInvoiceFetching
                                    ? <Skeleton width={100} />
                                    : String(invoice?.userId.name)}
                            </td>
                        </tr>
                        <tr>
                            <td>To</td>
                            <td>
                                {isInvoiceFetching
                                    ? <Skeleton width={100} />
                                    : String(invoice?.name)}
                            </td>
                        </tr>
                    </tbody>}
                    {/* MULTIUSE CHECKOUT FORM */}
                    {(invoice?.paymentCollection == "multi-use") && <tbody>
                        <tr>
                            <td>From</td>
                            <td>{String(invoice?.userId.name)}</td>
                        </tr>
                        <tr>
                            <td>Name</td>
                            <td><input type="text" onChange={(e) => setName(e.target.value)} required /></td>
                        </tr>
                        <tr>
                            <td>Email</td>
                            <td><input type="email" onChange={(e) => setEmail(e.target.value)} required /></td>
                        </tr>
                        <tr>
                            <td colSpan={2}>
                                <button className={styles.primaryBttn} disabled={isCheckoutPending} onClick={createCheckoutSession}>
                                    Proceed to Payment
                                </button>
                            </td>
                        </tr>
                    </tbody>}
                </table>
            </div>
            {/* PAYMENT */}
            {
                (invoice?.paymentCollection == "one-time") &&
                (invoice?.status == "paid"
                    ? <div className={`${styles.container} ${styles.success}`}>
                        <SuccessCheckIcon />
                    </div>
                    : ['outstanding', 'overdue'].includes(invoice?.status) && <div className={`${styles.container} ${styles.payment}`}>
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
                            disabled={isInvoiceFetching || isTransferPending || isCheckoutPending}
                        >
                            {isConnected
                                ? `Pay ${amount} USDC`
                                : `Connect Wallet`
                            }
                        </button>}
                        <button
                            className={styles.secondaryBttn}
                            disabled={isInvoiceFetching || isTransferPending || isCheckoutPending || !data}
                            onClick={() => setShowQr(!showQr)}
                        >
                            {
                                showQr
                                    ? <><WalletIcon /> Pay by Wallet</>
                                    : <><QRIcon /> Scan QR Code</>
                            }
                        </button>
                        {showQr && <div className={styles.qrContainer}>
                            <QRCodeSVG value={`ethereum:${invoice?.wallet?.address}@${process.env.NEXT_APP_ENV === "production" ? base.id : baseSepolia.id}`} />
                            <div className={styles.addressContainer}>
                                <span>Address: <input type="text" value={invoice?.wallet?.address || undefined} /></span>
                            </div>
                        </div>}
                    </div>
                )
            }
        </div >
    )
}