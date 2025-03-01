import Image from 'next/image'
import styles from './SideNav.module.scss'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@clerk/nextjs';

import HomeIcon from "../../public/assets/icons/home.svg";
import AccountIcon from "../../public/assets/icons/account.svg";
import FundsIcon from "../../public/assets/icons/funds.svg";
import InvoiceIcon from "../../public/assets/icons/invoice.svg";

export default function SideNav() {
    const pathname = usePathname();
    const { signOut } = useAuth();

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
        </div>
    )
}