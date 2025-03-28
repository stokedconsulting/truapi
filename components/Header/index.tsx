import { useAppUser } from '@/contexts/user.context'
import Image from 'next/image'
import styles from './Header.module.scss'
import Link from 'next/link';
import { addressExplorerLink, formatNumber, shortAddress } from '@/lib/utils';
import Skeleton from 'react-loading-skeleton'

export default function Header() {
    const { user, balances, isBalanceLoading } = useAppUser();

    const date = new Date();

    if (!user) return <></>

    return (
        <div className={styles.main}>
            <div className={styles.welcome}>
                <h3>Welcome, {user?.name.split(' ')[0]}!</h3>
                <span>{date.toLocaleDateString("en-US", { day: 'numeric' }) + "-" + date.toLocaleDateString("en-US", { month: 'short' }) + "-" + date.toLocaleDateString("en-US", { year: 'numeric' })}</span>
            </div>
            <div className={styles.chainInfo}>
                <div className={styles.container}>
                    <Image src="/assets/base-logo.png" alt="Base" width={20} height={20} />
                    <span>{process.env.NEXT_PUBLIC_APP_ENV === "production" ? "Base" : "Base Sepolia"}</span>
                </div>
                <Link className={styles.container} href={addressExplorerLink(user?.wallet.address || "")} target='_blank'>
                    {shortAddress(user.wallet.address)}
                </Link>
                <div className={styles.container}>
                    <span>Balance: </span>
                    {isBalanceLoading
                        ? <Skeleton width={50} />
                        : <span className={styles.value}>{formatNumber(balances?.usdc)} USDC</span>}
                </div>
            </div>
        </div>
    )
}