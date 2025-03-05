"use client";

import styles from "./InvoicePaymentsTable.module.scss"
import React, { useState, useMemo } from "react"
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    ColumnDef,
    SortingState,
} from "@tanstack/react-table"
import CustomTable from "../CustomTable"
import { useGetInvoicePayments } from "@/hooks/useGetInvoicePayments"
import { formatNumber, shortAddress, txnExplorerLink } from "@/lib/utils"

export interface PaymentRow {
    date: string;
    name: string;
    email: string;
    amount: number;
    transactionHash?: string;
}

export default function InvoicePaymentsTable({ invoiceId }: { invoiceId: string }) {
    const [sorting, setSorting] = useState<SortingState>([]);

    const { data } = useGetInvoicePayments(invoiceId);

    const tableData = useMemo<PaymentRow[]>(() => {
        if (!data?.payments) return [];
        return data.payments.map((p) => ({
            date: p.paidAt ? new Date(p.paidAt).toISOString() : "",
            name: p.name || "",
            email: p.email || "",
            amount: p.amount || 0,
            transactionHash: p.transactionHash || undefined,
        }));
    }, [data]);

    const columns = useMemo<ColumnDef<PaymentRow>[]>(
        () => [
            {
                accessorKey: "date",
                header: "Date",
                cell: ({ getValue }) => {
                    const isoStr = getValue() as string;
                    if (!isoStr) return "N/A";
                    return new Date(isoStr).toLocaleString();
                },
            },
            {
                accessorKey: "name",
                header: "Name",
                cell: ({ getValue }) => getValue() || "N/A",
            },
            {
                accessorKey: "email",
                header: "Email",
                cell: ({ getValue }) => getValue() || "N/A",
            },
            {
                accessorKey: "amount",
                header: "Amount",
                // @todo - dynamic asset
                cell: ({ row, getValue }) => `${formatNumber(getValue() as number)} USDC`,
            },
            {
                accessorKey: "transactionHash",
                header: "Tx Hash",
                cell: ({ getValue }) => {
                    const tx = getValue() as string;
                    if (!tx) return "N/A";
                    return <a href={txnExplorerLink(tx)} className={styles.txnLink}>{shortAddress(tx, 10)}</a>;
                },
            },
        ],
        []
    );

    const table = useReactTable({
        data: tableData,
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <CustomTable
            title="Payments"
            table={table}
            paginationEnabled={false}
            searchEnabled={false}
        />
    );
}
