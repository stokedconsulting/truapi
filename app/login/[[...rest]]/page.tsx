import { SignIn } from "@clerk/nextjs"
import Image from "next/image"
import styles from "./Login.module.scss"

export default function Page() {
    return (
        <div className={styles.main}>
            <Image
                src="/assets/superpay-logo.svg"
                alt="SuperPay"
                width={200}
                height={200}
            />
            <SignIn signUpUrl="/register" />
            <Image
                src="/assets/CDP-badge.svg"
                alt="Coinbase Developer Platform"
                width={220}
                height={200}
            />
        </div>
    );
}
