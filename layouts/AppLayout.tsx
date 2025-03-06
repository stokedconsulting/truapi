"use client"

import Image from 'next/image'
import { useAuth, SignedIn } from '@clerk/nextjs'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import SideNav from '@/components/SideNav'
import styles from "./AppLayout.module.scss"
import Header from '@/components/Header'
import BackIcon from "../public/assets/icons/back.svg"
import { useAppUser } from '@/contexts/user.context'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { userId, isLoaded } = useAuth()
    const { isUserLoading } = useAppUser();
    const router = useRouter()
    const pathname = usePathname()
    const segments = pathname.split('/').filter(Boolean)

    useEffect(() => {
        if (isLoaded) {
            if (!pathname.includes('payment') && !userId) router.push('/login')
            // else if (userId) router.push('/home')
        }
    }, [isLoaded])

    // if (!isLoaded) return 'Loading...'

    if (pathname.includes('payment'))
        return (
            <div className={`${styles.main} ${styles.payment}`}>
                <div className={styles.outlet}>
                    {children}
                </div>
            </div>
        )
    else
        return (
            <div className={styles.main}>
                {/* SIDENAV */}
                <SignedIn>
                    <SideNav />
                </SignedIn>
                <div className={styles.outlet}>
                    <SignedIn>
                        <Header />
                        {segments.length > 1 && (
                            <button className={styles.backRow} onClick={() => router.back()}>
                                <BackIcon />
                                <span>{String(segments[0][0]).toUpperCase() + String(segments[0]).slice(1)}</span>
                            </button>
                        )}
                    </SignedIn>
                    {children}
                </div>
                {(!isLoaded || isUserLoading) && <div className={styles.loadingOverlay}>
                    <Image src="/assets/superpay-logo.svg" alt='SuperPay' width={300} height={50} />
                    <div className={styles.abstract1} />
                    <div className={styles.abstract2} />
                    <div className={styles.abstract3} />
                </div>}
            </div>
        )
}