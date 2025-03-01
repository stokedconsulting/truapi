import { JSX } from "react"
import styles from "./ActionCard.module.scss"
import Link from "next/link"

type ActionCardProps = {
    item: {
        icon: JSX.Element,
        title: string,
        description: string,
        action: string,
        url: string,
        badge?: JSX.Element
    }
}

export default function ActionCard({ item }: ActionCardProps) {
    return (
        <div className={styles.actionCard}>
            {item.badge && <div className={styles.badge}>
                {item.badge}
            </div>}
            <div className={styles.content}>
                <div>
                    {item.icon}
                </div>
                <div className={styles.text}>
                    <span className={styles.title}>{item.title}</span>
                    <span className={styles.description}>{item.description}</span>
                </div>
            </div>
            <Link href={item.url} className={styles.action}>
                {item.action}
            </Link>
        </div>
    )
}