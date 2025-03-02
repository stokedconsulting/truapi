import styles from "./Home.module.scss"
import BuyIcon from "@/public/assets/icons/buy.svg"
import SendIcon from "@/public/assets/icons/send.svg"
import InvoiceIcon from "@/public/assets/icons/invoice.svg"
import ActionCard from "@/components/ActionCard"
import ActivityChart from "@/components/ActivityChart"
import HomeTable from "@/components/HomeTable"

export default function Page() {

    return (
        <div className={styles.main}>
            {/* HERO/TOP SECTION */}
            <div className={styles.hero}>
                {/* ACTION CARDS */}
                <div className={styles.actionCardContainer}>
                    {actionCardItems.map((item, index) => {
                        return <ActionCard key={index} item={item} />
                    })}
                </div>
                {/* CHART + ACTIVITY */}
                <div className={styles.activityContainer}>
                    {/* HEADER INFO */}
                    <div className={styles.header}>
                        <div className={styles.topRow}>
                            <h3>Activity</h3>
                            {/* <select name="period" id="period">
                                <option value="1">Last 24 hours</option>
                                <option value="7">Last Week</option>
                                <option value="30">Last Month</option>
                                <option value="365">Last Year</option>
                            </select> */}
                        </div>
                        <div className={styles.dataRow}>
                            <div className={styles.dataItem}>
                                <span className={styles.key}>Gross Volume</span>
                                <span className={styles.value}>$1,000</span>
                            </div>
                            <div className={styles.dataItem}>
                                <span className={styles.key}>Total Payments</span>
                                <span className={styles.value}>100</span>
                            </div>
                            <div className={styles.dataItem}>
                                <span className={styles.key}>Total USDC Rewards</span>
                                <span className={styles.value}>$1,000</span>
                            </div>
                        </div>
                    </div>
                    <ActivityChart />
                </div>
            </div>
            {/* TABLE/HISTORY SECTION */}
            <div className={styles.tableContainer}>
                <HomeTable />
            </div>
        </div>
    );
}

const actionCardItems = [
    {
        icon: <BuyIcon />,
        title: "Buy USDC",
        description: "Earn 4.1% APY on your USDC",
        action: "Buy",
        url: "/funds/onramp"
    },
    {
        icon: <SendIcon />,
        title: "Send USDC",
        description: "Send USDC Payments",
        action: "Send",
        url: "/funds/pay"
    },
    {
        icon: <InvoiceIcon />,
        title: "Invoice",
        description: "Create and Send USDC Invoices",
        action: "Create",
        url: "/invoice/create"
    }
]