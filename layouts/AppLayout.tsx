"use client"

import { useAuth, SignedIn } from '@clerk/nextjs'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import SideNav from '@/components/SideNav'
import styles from "./AppLayout.module.scss"
import Header from '@/components/Header'
import BackIcon from "../public/assets/icons/back.svg"

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { userId, isLoaded } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const segments = pathname.split('/').filter(Boolean)

    useEffect(() => {
        if (isLoaded) {
            if (!userId) router.push('/login')
            // else if (userId) router.push('/home')
        }
    }, [isLoaded])

    // if (!isLoaded) return 'Loading...'

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
        </div>
    )
}