"use client"

import { useAppUser } from "@/contexts/user.context"
import Image from "next/image"
import Link from "next/link"
import styles from "./Accounts.module.scss"
import { addressExplorerLink, getUserImage, shortAddress } from "@/lib/utils"
import EmailIcon from "@/public/assets/icons/email.svg"

// @todo - Skeleton Loader

export default function Page() {
    const { user, balances } = useAppUser();

    return (
        <div className={styles.main}>
            <div className={styles.profileCard}>
                {getUserImage(user,undefined,150,150)}
                <span className={styles.name}>{user?.name}</span>
                <div className={styles.email}>
                    <EmailIcon />
                    <span>{user?.email}</span>
                </div>
                <div className={styles.valueRow}>
                    <span>Wallet Address</span>
                    <Link href={addressExplorerLink(user?.wallet.address || "")} className={styles.valueContainer}>
                        <span>{shortAddress(user?.wallet.address)}</span>
                    </Link>
                </div>
                <div className={styles.valueRow}>
                    <span>ETH Balance</span>
                    <div className={styles.valueContainer}>
                        <Image src="/assets/ethereum-logo.png" alt="ethereum" width={20} height={20} />
                        <span className={styles.value}>{balances?.eth}</span>
                    </div>
                </div>
                <div className={styles.valueRow}>
                    <span>USDC Balance</span>
                    <div className={styles.valueContainer}>
                        <Image src="/assets/usdc-logo.png" alt="usdc" width={20} height={20} />
                        <span className={styles.value}>{balances?.usdc}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
