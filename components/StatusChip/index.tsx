import styles from "./StatusChip.module.scss"

export function StatusChip({ title, className }: { title: string, className: string }) {
    return (
        <div className={`${styles.main} ${styles[className.split(' ')[0]]}`}>
            {title}
        </div>
    )
}