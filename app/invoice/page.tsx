"use client";

import { useMemo } from "react";
import styles from "./Invoice.module.scss";
import ActionCard from "@/components/ActionCard";
import InvoiceIcon from "@/public/assets/icons/invoice.svg";
import InvoiceTable from "@/components/InvoiceTable";
import { useGetUserInvoicesStats } from "@/hooks/useGetUserInvoiceStats";

export default function Page() {
    const { data: invoiceStats } = useGetUserInvoicesStats();

    const stats = useMemo(() => [
        {
            title: "All",
            value: invoiceStats?.totalCount
        },
        {
            title: "Draft",
            value: invoiceStats?.draftCount
        },
        {
            title: "Overdue",
            value: invoiceStats?.overdueCount
        },
        {
            title: "Outstanding",
            value: invoiceStats?.outstandingCount
        },
        {
            title: "Paid",
            value: invoiceStats?.paidCount
        },
        {
            title: "Partial",
            value: invoiceStats?.partiallyPaidCount
        },
    ], [invoiceStats])

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
                        <ActionCard
                            className={"invoices"}
                            item={{
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
                <InvoiceTable />
            </div>
        </div>
    );
}
