import styles from "./Funds.module.scss";
import UsdcIcon from "../../public/assets/icons/usdc.svg";
import QrIcon from "../../public/assets/icons/qr.svg";
import PayIcon from "../../public/assets/icons/pay.svg";
import ActionCard from "@/components/ActionCard";
import HomeTable from "@/components/HomeTable";
import Image from "next/image";

export default function Page() {
    return (
        <div className={styles.main}>
            <div className={styles.actionCardContainer}>
                {actionCardItems.map((item, index) => {
                    return <ActionCard key={index} item={item} className={"column"} />
                })}
            </div>
            <div className={styles.tableContainer}>
                <HomeTable />
            </div>
        </div>
    );
}

const actionCardItems = [
    {
        icon: <UsdcIcon />,
        title: "Buy USDC",
        description: "$1 USD = $1 USDC",
        action: "Buy",
        url: "/funds/onramp",
        badge: <Image src={"/assets/coinbase-onramp-badge.png"} alt="coinbase onramp" width={108} height={28} />
    },
    {
        icon: <QrIcon />,
        title: "Receive Funds",
        description: "100% Free",
        action: "Scan",
        url: "/funds/receive"
    },
    {
        icon: <PayIcon />,
        title: "Make Payments",
        description: "Upload CSV",
        action: "Pay",
        url: "/funds/pay"
    }
]
