"use client";

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from "react"
import MinusCircleIcon from "@/public/assets/icons/minus-circle.svg"
import styles from "./CreateInvoice.module.scss"
import { useCreateInvoice } from "@/hooks/useCreateInvoice"
import { InvoiceItem } from "@/types/api.types"
import { useGetUserInvoices } from '@/hooks/useGetUserInvoices'
import Dropdown, { OptionType } from '@/components/Dropdown'

// @todo - success redirect

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

export default function Page() {
    const searchParams = useSearchParams()
    const invoiceId = searchParams.get('invoiceId')

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [date, setDate] = useState('');
    const [paymentCollection, setPaymentCollection] = useState(paymentCollectionOptions[0]);
    const [rows, setRows] = useState<InvoiceItem[]>([{ itemName: '', price: '' }]);

    const { data, isFetching: isInvoiceFetching } = useGetUserInvoices(invoiceId || null);
    const { createInvoice, isPending } = useCreateInvoice(name, email, date, paymentCollection.name as "one-time" | "multi-use", rows);

    // Set values from draft invoice
    useEffect(() => {
        if (!data) return;

        setName(data[0].name);
        setEmail(data[0].email);
        const date = (new Date(data[0].dueDate as unknown as string));
        const formattedDate = date.getFullYear() + "-"
            + date.getMonth().toString().padStart(2, '0')
            + "-" + date.getDay().toString().padStart(2, '0');
        setDate(formattedDate);
        const paymentCollection = paymentCollectionOptions.filter((option) => option.name == data[0].paymentCollection)[0];
        setPaymentCollection(paymentCollection);
        setRows(data[0].invoiceItems as unknown as InvoiceItem[]);
    }, [data])

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
                        <span className={styles.value}>#{invoiceId}</span>
                    </div>
                }
                {/* NAME */}
                <div className={styles.columnContainer}>
                    <span className={styles.title}>Name</span>
                    <input type="text" value={name} onChange={(event) => setName(event.target.value)} disabled={isPending || isInvoiceFetching} />
                </div>
                {/* Email */}
                <div className={styles.columnContainer}>
                    <span className={styles.title}>Email</span>
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isPending || isInvoiceFetching} />
                </div>
                {/* Due Date */}
                <div className={styles.columnContainer}>
                    <span className={styles.title}>Due Date</span>
                    <input type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={isPending || isInvoiceFetching} />
                </div>
                {/* Receive Payments In */}
                <div className={styles.columnContainer}>
                    <span className={styles.title}>Receive Payments In</span>
                    <input type="text" value={"USDC"} disabled />
                </div>
                {/* Payment Collection */}
                <div className={styles.columnContainer}>
                    <span className={styles.title}>Payment Collection</span>
                    {/* <input type="text" value={"One Time"} /> */}
                    <Dropdown options={paymentCollectionOptions} selected={paymentCollection} onChange={(option) => setPaymentCollection(option)} />
                </div>
                {/* Invoice Items */}
                <div className={styles.columnContainer}>
                    <span className={styles.title}>Invoices Items</span>
                    <table>
                        <tbody>
                            {rows.map((row, index) => {
                                return <tr key={index}>
                                    <td>
                                        <input type="text" name="itemName" value={row.itemName} onChange={(e) => handleRowInputChange(index, e)} disabled={isPending || isInvoiceFetching} />
                                    </td>
                                    <td>
                                        <div className={styles.amountCell}>
                                            <input type="number" name="price" value={row.price} onChange={(e) => handleRowInputChange(index, e)} disabled={isPending || isInvoiceFetching} />

                                            {(index > 0) &&
                                                <button type="button" onClick={() => removeRow(index)} disabled={isPending || isInvoiceFetching}>
                                                    <MinusCircleIcon />
                                                </button>}
                                        </div>
                                    </td>
                                </tr>
                            })}
                        </tbody>
                    </table>
                    <button className={styles.addBttn} onClick={addRow} disabled={isPending || isInvoiceFetching}>+ Add</button>
                </div>
                <div className={styles.actionContainer}>
                    <button className={styles.secondaryBttn} disabled={isPending || isInvoiceFetching} onClick={() => createInvoice(true)}>Save Draft</button>
                    <button className={styles.primaryBttn} disabled={isPending || isInvoiceFetching} onClick={() => createInvoice()}>Send</button>
                </div>
            </div>
        </div>
    );
}
