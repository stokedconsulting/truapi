"use client"

import Link from "next/link"
import { useGetUserInvoices } from "@/hooks/useGetUserInvoices"
import styles from "./InvoicePage.module.scss"
import { useParams, useRouter } from "next/navigation"
import { useMemo } from "react"
import { StatusChip } from "@/components/StatusChip"
import { useVoidInvoice } from "@/hooks/useVoidInvoice"
import EditIcon from "../../../public/assets/icons/edit.svg"
import DeleteIcon from "../../../public/assets/icons/delete.svg"
import LinkIcon from "../../../public/assets/icons/link.svg"
import InvoicePaymentsTable from "@/components/InvoicePaymentsTable"

export default function Page() {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const router = useRouter();

    const { data, isFetching } = useGetUserInvoices(invoiceId);
    const invoice = useMemo(() => data ? data.invoices[0] : undefined, [data]);
    const amount = useMemo(() => (invoice?.invoiceItems || []).reduce(
        (acc: number, item: any) => acc + (item.price || 0),
        0
    ), [invoice]);
    const { voidInvoice, isPending } = useVoidInvoice(invoice?.id);

    return (
        <div className={styles.main}>
            <div className={styles.header}>
                <div className={styles.column}>
                    <div className={styles.invoiceIdContainer}>
                        <h3>Invoice</h3>
                        <h3 className={styles.value}>#{invoiceId.toUpperCase()}</h3>
                    </div>
                    <span className={styles.title}>{invoice?.name} | {invoice?.email}</span>
                </div>
                <div className={styles.column}>
                    <span className={styles.title}>Amount</span>
                    <span className={styles.subtitle}>{amount} {invoice?.paymentAsset.toUpperCase()}</span>
                </div>
                <div className={styles.column}>
                    <span className={styles.title}>Date</span>
                    <span className={styles.subtitle}>{(new Date(invoice?.createdAt as unknown as string)).toLocaleDateString()}</span>
                </div>
                <div className={styles.column}>
                    <span className={styles.title}>Due</span>
                    <span className={styles.subtitle}>{(new Date(invoice?.dueDate as unknown as string)).toLocaleDateString()}</span>
                </div>
                <div className={styles.column}>
                    <span className={styles.title}>Collection</span>
                    <span className={styles.subtitle}>{invoice?.paymentCollection}</span>
                </div>
                <div className={styles.column}>
                    <StatusChip title={invoice?.status.toUpperCase()} className={invoice?.status} />
                    <div className={`${styles.actionRow}`}>
                        {!["draft", "void"].includes(invoice?.status as string) &&
                            <Link
                                href={`/payment/${invoiceId}`}
                                target="_blank"
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                <LinkIcon />
                            </Link>}
                        {["draft", "outstanding", "overdue"].includes(invoice?.status as string) &&
                            <button onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/invoice/create?invoiceId=${invoiceId}`)
                            }}>
                                <EditIcon />
                            </button>}
                        {["draft", "outstanding", "overdue"].includes(invoice?.status as string) &&
                            <button onClick={(e) => {
                                e.stopPropagation();
                                voidInvoice();
                            }}>
                                <DeleteIcon />
                            </button>}
                    </div>
                </div>
            </div>
            <div className={styles.tableContainer}>
                <InvoicePaymentsTable invoiceId={invoiceId} />
            </div>
        </div>
    )
}