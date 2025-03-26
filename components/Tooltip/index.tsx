import { ReactNode } from 'react';
import styles from './Tooltip.module.scss';

interface TooltipProps {
    children: ReactNode;
    content: ReactNode;
}

export default function Tooltip({ children, content }: TooltipProps) {
    return (
        <div className={styles.tooltipContainer}>
            {children}
            <div className={styles.tooltip}>
                {content}
            </div>
        </div>
    );
} 