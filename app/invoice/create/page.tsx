"use client";

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from "react"
import MinusCircleIcon from "@/src/assets/minus-circle.svg"
import styles from "./CreateInvoice.module.scss"
import { useCreateInvoice } from "@/hooks/useCreateInvoice"
import { InvoiceItem } from "@/types/api.types"
import { useGetUserInvoices } from '@/hooks/useGetUserInvoices'
import Dropdown, { OptionType } from '@/components/Dropdown'
import { StatusChip } from '@/components/StatusChip';

export default function Page() {
    const searchParams = useSearchParams()
    const invoiceId = searchParams.get('invoiceId')
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [date, setDate] = useState('');
    const [paymentCollection, setPaymentCollection] = useState(paymentCollectionOptions[0]);
    const [rows, setRows] = useState<InvoiceItem[]>([{ itemName: '', price: '' }]);
    const [isDisabled, setIsDisabled] = useState(false);

    const { data, isFetching: isInvoiceFetching } = useGetUserInvoices(invoiceId || null);
    const invoice = useMemo(() => data ? data.invoices[0] : undefined, [data]);
    const { createInvoice, isPending, data: newInvoiceData, isSuccess } = useCreateInvoice(name, email, date, paymentCollection.name as "one-time" | "multi-use", rows, invoiceId || undefined);

    useEffect(() => {
        if (!isSuccess || !newInvoiceData) return;
        router.push(`/invoice/${newInvoiceData._id}`)
    }, [newInvoiceData, isSuccess])

    // Set values from draft invoice
    useEffect(() => {
        if (!invoice || !invoiceId) return;

        setName(invoice.name);
        setEmail(invoice.email);
        const date = (new Date(invoice.dueDate as unknown as string));
        const offset = date.getTimezoneOffset()
        const formattedDate = (new Date(date.getTime() - (offset * 60 * 1000))).toISOString().split('T')[0]
        console.log(formattedDate)
        setDate(formattedDate);
        const paymentCollection = paymentCollectionOptions.filter((option) => option.name == invoice.paymentCollection)[0];
        setPaymentCollection(paymentCollection);
        setRows(invoice.invoiceItems as unknown as InvoiceItem[]);

        if (["paid", "void", "partially paid"].includes(invoice.status))
            setIsDisabled(true);
    }, [invoice])

    const addRow = () => {
        setRows([...rows, { itemName: '', price: '' }]);
    };

    const removeRow = (index: number) => {
        const newRows = [...rows];
        newRows.splice(index, 1);
        setRows(newRows);
    }

    const handleRowInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        const newRows = [...rows];
        newRows[index][name as keyof InvoiceItem] = value;
        setRows(newRows);
    };

    return (
        <div className={styles.main}>
            <div className={styles.formContainer}>
                {(invoiceId && data) &&
                    <div className={styles.invoiceId}>
                        <span className={styles.key}>Invoice ID:</span>
                        <span className={styles.value}>#{invoiceId.toUpperCase()}</span>
                        {invoice && <StatusChip title={invoice?.status.toUpperCase()} className={invoice?.status} />}
                    </div>
                }
                {/* NAME */}
                <div className={styles.columnContainer}>
                    <span className={styles.title}>Recipient (Company or Name)</span>
                    <input type="text" value={name} onChange={(event) => setName(event.target.value)} disabled={isPending || isInvoiceFetching || isDisabled} />
                </div>
                {/* Email */}
                <div className={styles.columnContainer}>
                    <span className={styles.title}>Email</span>
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isPending || isInvoiceFetching || isDisabled} />
                </div>
                {/* Payment Collection */}
                <div className={styles.columnContainer}>
                    <span className={styles.title}>Payment Collection</span>
                    <Dropdown options={paymentCollectionOptions} selected={paymentCollection} onChange={(option) => setPaymentCollection(option)} disabled={isPending || isInvoiceFetching || isDisabled} />
                </div>
                {/* Due Date */}
                {(paymentCollection.name == "one-time") && <div className={styles.columnContainer}>
                    <span className={styles.title}>Due Date</span>
                    <input type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={isPending || isInvoiceFetching || isDisabled} />
                </div>}
                {/* Receive Payments In */}
                <div className={styles.columnContainer}>
                    <span className={styles.title}>Receive Payments In</span>
                    <input type="text" value={"USDC"} disabled />
                </div>
                {/* Invoice Items */}
                <div className={styles.columnContainer}>
                    <span className={styles.title}>Invoice Line Item</span>
                    <table>
                        <tbody>
                            {rows.map((row, index) => {
                                return <tr key={index}>
                                    <td>
                                        <input type="text" name="itemName" placeholder='ex: Consulting Services' value={row.itemName} onChange={(e) => handleRowInputChange(index, e)} disabled={isPending || isInvoiceFetching || isDisabled} />
                                    </td>
                                    <td>
                                        <div className={styles.amountCell}>
                                            <input type="number" name="price" placeholder='Amount' value={row.price} onChange={(e) => handleRowInputChange(index, e)} disabled={isPending || isInvoiceFetching || isDisabled} />

                                            {(index > 0 && !isDisabled) &&
                                                <button type="button" onClick={() => removeRow(index)} disabled={isPending || isInvoiceFetching || isDisabled}>
                                                    <MinusCircleIcon />
                                                </button>}
                                        </div>
                                    </td>
                                </tr>
                            })}
                        </tbody>
                    </table>
                    <button className={styles.addBttn} onClick={addRow} disabled={isPending || isInvoiceFetching || isDisabled}>+ Add</button>
                </div>
                <div className={styles.actionContainer}>
                    <button className={styles.secondaryBttn} disabled={isPending || isInvoiceFetching || isDisabled} onClick={() => createInvoice(true)}>Save Draft</button>
                    <button className={styles.primaryBttn} disabled={isPending || isInvoiceFetching || isDisabled} onClick={() => createInvoice()}>Send</button>
                </div>
            </div>
        </div>
    );
}

const paymentCollectionOptions: OptionType[] = [
    {
        icon: undefined,
        name: 'one-time'
    },
    {
        icon: undefined,
        name: 'multi-use'
    },
]