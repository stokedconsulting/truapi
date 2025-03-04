"use client";

import styles from "./InvoiceTable.module.scss"
import React, { useState, useMemo } from "react"
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    ColumnDef,
    SortingState,
    Row,
} from "@tanstack/react-table"
import CustomTable from "../CustomTable"
import { useGetUserInvoices } from "@/hooks/useGetUserInvoices"
import { formatNumber, shortAddress } from "@/lib/utils"
import { StatusChip } from "../StatusChip"
import { useRouter } from "next/navigation"
import EditIcon from "../../public/assets/icons/edit.svg";
import DeleteIcon from "../../public/assets/icons/delete.svg";
import { useCreateInvoice } from "@/hooks/useCreateInvoice";
import { useVoidInvoice } from "@/hooks/useVoidInvoice";

interface InvoiceRow {
    id: string | any;
    name: string;
    email: string;
    status: "draft" | "outstanding" | "overdue" | "paid" | "void" | "partially paid";
    createdAt: NativeDate | string;
    dueAt?: NativeDate | null | string;
    amount: number;
    asset: string;
}

export default function InvoiceTable() {
    const [pageIndex, setPageIndex] = useState(0);
    const router = useRouter();
    const { data } = useGetUserInvoices(null, 10, pageIndex);

    const tableData = data?.invoices || [];
    const totalCount = data?.totalCount || 0;
    const pageSize = 10;
    const pageCount = Math.ceil(totalCount / pageSize);

    const columns: ColumnDef<InvoiceRow>[] = [
        {
            accessorKey: "createdAt",
            header: "Created",
            cell: ({ getValue }) => {
                const isoStr = getValue() as string;
                const date = new Date(isoStr).toLocaleString();
                return date;
            },
        },
        {
            accessorKey: "id",
            header: "ID",
            cell: ({ getValue }) => {
                return (
                    <div className={styles.value}>
                        {"#" + shortAddress((getValue() as string).toUpperCase())}
                    </div>
                );
            },
        },
        {
            accessorKey: "name",
            header: "Name",
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ getValue }) => {
                return (<StatusChip title={(getValue() as string).toUpperCase()} className={getValue() as string} />);
            },
        },
        {
            accessorKey: "amount",
            header: "Amount",
            cell: ({ row, getValue }) => `${formatNumber(getValue() as number)} ${row.original.asset.toUpperCase()}`,
        },
        {
            header: "Actions",
            cell: ({ row }) => <ActionRow row={row} />
        }
    ];

    const transformedData: InvoiceRow[] = useMemo(() => {
        return tableData.map((inv) => {
            const amount = (inv.invoiceItems || []).reduce(
                (acc: number, item: any) => acc + (item.price || 0),
                0
            );
            return {
                id: inv._id,
                name: inv.name,
                email: inv.email,
                status: inv.status,
                createdAt: inv.createdAt,
                dueAt: inv.dueDate,
                amount,
                asset: inv.paymentAsset
            };
        });
    }, [tableData]);

    const [sorting, setSorting] = useState<SortingState>([]);

    const table = useReactTable({
        data: transformedData,
        columns,
        pageCount,
        manualPagination: true,
        state: {
            pagination: {
                pageIndex,
                pageSize,
            },
            sorting,
        },
        onPaginationChange: (updater) => {
            if (typeof updater === "function") {
                const nextState = updater({
                    pageIndex,
                    pageSize,
                });
                setPageIndex(nextState.pageIndex);
            } else {
                setPageIndex(updater.pageIndex);
            }
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <CustomTable
            title="Invoices"
            columns={columns}
            data={table.getRowModel().rows.map((row) => row.original)}
            paginationEnabled
            searchEnabled={false}
            table={table}
            rowOnClick={(row) => router.push(`/invoice/${row.original.id}`)}
        />
    );
}

function ActionRow({ row }: { row: Row<InvoiceRow> }) {
    const router = useRouter();
    const { voidInvoice, isPending } = useVoidInvoice(row.original.id);

    return (
        <div className={`${styles.actionRow} ${isPending ? styles.disabled : ""}`}>
            {["draft", "outstanding", "overdue"].includes(row.original.status) &&
                <button onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/invoice/create?invoiceId=${row.original.id}`)
                }}>
                    <EditIcon />
                </button>}
            {["draft", "outstanding", "overdue"].includes(row.original.status) &&
                <button onClick={(e) => {
                    e.stopPropagation();
                    voidInvoice();
                }}>
                    <DeleteIcon />
                </button>}
        </div>
    )
}
