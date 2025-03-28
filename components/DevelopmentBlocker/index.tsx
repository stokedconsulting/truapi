import styles from './DevelopmentBlocker.module.scss';
import { useRouter } from 'next/navigation';

interface DevelopmentBlockerProps {
    pageName: string;
}

export const DevelopmentBlocker = ({ pageName }: DevelopmentBlockerProps) => {
    const router = useRouter();
    
    // Only show in development environment
    if (process.env.NEXT_APP_ENV !== 'development') {
        return null;
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.content}>
                <h2>Development Mode</h2>
                <p>The {pageName} page is currently disabled in development environment.</p>
                <p>This feature will be available in production.</p>
                <button className={styles.secondaryBttn} onClick={() => router.back()}>
                    Go Back
                </button>
            </div>
        </div>
    );
}; 