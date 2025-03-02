"use client";

import { useMemo } from "react";
import styles from "./Invoice.module.scss";
import ActionCard from "@/components/ActionCard";
import InvoiceIcon from "@/public/assets/icons/invoice.svg";
import HomeTable from "@/components/HomeTable";

export default function Page() {

    const stats = useMemo(() => [
        {
            title: "All",
            value: 5
        },
        {
            title: "Draft",
            value: 5
        },
        {
            title: "Overdue",
            value: 5
        },
        {
            title: "Outstanding",
            value: 5
        },
        {
            title: "Paid",
            value: 5
        },
        {
            title: "Partial",
            value: 5
        },
    ], [])

    return (
        <div className={styles.main}>
            {/* HEADER */}
            <div className={styles.header}>
                <h3>Invoices</h3>
                <div className={styles.statsContainer}>
                    <div className={styles.stats}>
                        {stats.map((stat) => {
                            return (
                                <div key={stat.title} className={styles.stat}>
                                    <span className={styles.title}>{stat.title}</span>
                                    <span className={styles.value}>{stat.value}</span>
                                </div>
                            )
                        })}
                    </div>
                    <div className={styles.actionCardContainer}>
                        <ActionCard item={{
                            icon: <InvoiceIcon />,
                            title: "Create Invoice",
                            description: "Create and Send Crypto Invoices",
                            url: '/invoice/create',
                            action: 'Create',
                        }} />
                    </div>
                </div>
            </div>
            {/* INVOICES TABLE */}
            <div className={styles.tableContainer}>
                <HomeTable />
            </div>
        </div>
    );
}
