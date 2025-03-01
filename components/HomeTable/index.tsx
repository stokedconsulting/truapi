"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import CustomTable from "../CustomTable";

// Define Type for Table Data
interface Transaction {
    date: string;
    amount: string;
    status: "Paid" | "Pending" | "Failed";
    name: string;
    method: string;
    action: string;
}

const data: Transaction[] = [
    { date: "2024-02-25", amount: "$100", status: "Paid", name: "John Doe", method: "Credit Card", action: "View" },
    { date: "2024-02-26", amount: "$200", status: "Pending", name: "Jane Smith", method: "PayPal", action: "View" },
    { date: "2024-02-27", amount: "$150", status: "Failed", name: "Alice Brown", method: "Bank Transfer", action: "Retry" },
];

const columns: ColumnDef<Transaction, any>[] = [
    {
        accessorKey: "date",
        header: "Date",
        cell: (info) => info.getValue(),
    },
    {
        accessorKey: "amount",
        header: "Amount",
        cell: (info) => info.getValue(),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: (info) => <span className={`status ${info.getValue().toLowerCase()}`}>{info.getValue()}</span>,
    },
    {
        accessorKey: "name",
        header: "Customer Name",
        cell: (info) => info.getValue(),
    },
    {
        accessorKey: "method",
        header: "Payment Method",
        cell: (info) => info.getValue(),
    },
    {
        accessorKey: "action",
        header: "Action",
        cell: (info) => (
            <button className="action-btn">
                {info.getValue()}
            </button>
        ),
    },
];

export default function HomeTable() {
    return (
        <CustomTable columns={columns} data={data} />
    );
};
