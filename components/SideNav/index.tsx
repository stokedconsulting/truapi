"use client"

import Image from 'next/image'
import styles from './SideNav.module.scss'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

import HomeIcon from "../../src/assets/home.svg"
import AccountIcon from "../../src/assets/account.svg"
import FundsIcon from "../../src/assets/funds.svg"
import InvoiceIcon from "../../src/assets/invoice.svg"
import MenuIcon from "../../src/assets/menu.svg"
import { useEffect, useRef, useState } from 'react'

export default function SideNav() {
    const pathname = usePathname();
    const { signOut } = useAuth();
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    const menu = [
        {
            name: 'Home',
            icon: HomeIcon,
            link: '/home'
        },
        {
            name: 'Account',
            icon: AccountIcon,
            link: '/account'
        },
        {
            name: 'Funds',
            icon: FundsIcon,
            link: '/funds'
        },
        {
            name: 'Invoice',
            icon: InvoiceIcon,
            link: '/invoice'
        }
    ]

    const toggleMenu = () => setIsOpen(!isOpen);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className={styles.main}>
            <div className={styles.logo}>
                <Image
                    src="/assets/superpay-logo.svg"
                    alt="SuperPay"
                    width={130}
                    height={45}
                />
            </div>
            <div className={styles.menu}>
                {menu.map((item, index) => (
                    <Link href={item.link} key={index} className={`${styles.menuItem} ${pathname.toLowerCase().includes(item.name.toLowerCase()) ? styles.active : ''}`}>
                        <item.icon />
                        {item.name}
                    </Link>
                ))}
            </div>
            <div className={`${styles.mobileMenu} ${isOpen ? styles.isOpen : ""}`} onClick={toggleMenu} ref={mobileMenuRef}>
                <MenuIcon />
                <div className={`${styles.menuItems}`}>
                    {menu.map((item, index) => (
                        <Link href={item.link} key={index} className={`${styles.menuItem} ${pathname.toLowerCase().includes(item.name.toLowerCase()) ? styles.active : ''}`}>
                            <item.icon />
                        </Link>
                    ))}
                    <div className={styles.menuItem} onClick={() => signOut()}>
                        <Image
                            src="/assets/icons/logout.svg"
                            alt="Logout"
                            width={24}
                            height={24}
                        />
                    </div>
                </div>
            </div>
            <div className={styles.footer}>
                <div className={styles.footerItem}>
                    <Image
                        src="/assets/icons/help.svg"
                        alt="Help"
                        width={24}
                        height={24}
                    />
                    <span>Help</span>
                </div>
                <div className={styles.footerItem} onClick={() => signOut()}>
                    <Image
                        src="/assets/icons/logout.svg"
                        alt="Logout"
                        width={24}
                        height={24}
                    />
                    <span>Logout</span>
                </div>
            </div>
        </div >
    )
}