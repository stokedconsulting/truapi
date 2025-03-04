"use client";

import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import CustomTable from "../CustomTable";
import { useGetRecentActivity } from "@/hooks/useGetRecentActivity";
import { shortAddress } from "@/lib/utils";
interface ActivityRow {
    date: string;
    type: string;
    amount: string;
    nameOrAddress: string;
    status: string;
    transactionHash?: string;
}

const columns: ColumnDef<ActivityRow>[] = [
    {
        accessorKey: "date",
        header: "Date",
        cell: ({ getValue }) => getValue(),
    },
    {
        accessorKey: "type",
        header: "Type",
        cell: ({ getValue }) => getValue(),
    },
    {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ getValue }) => getValue(),
    },
    {
        accessorKey: "nameOrAddress",
        header: "Name / Address",
        cell: ({ getValue }) => getValue(),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => getValue(),
    },
];

export default function RecentActivityTable() {
    const { data } = useGetRecentActivity();

    const tableData = useMemo<ActivityRow[]>(() => {
        const activity = data?.activity || [];
        return activity.map((item) => {
            const dateStr = new Date(item.timestamp as number).toLocaleString();
            const assetStr = item.asset || "";
            const amountStr = `${(item.amount || 0).toFixed(2)} ${assetStr.toUpperCase()}`;
            let nameOrAddress = item.name || item.email || shortAddress(item.address, 10) || "N/A";
            const statusStr = item.status || "";

            return {
                date: dateStr,
                type: item.type.toUpperCase(),
                amount: amountStr,
                nameOrAddress,
                status: statusStr,
                transactionHash: item.transactionHash || undefined,
            };
        });
    }, [data]);

    return (
        <CustomTable title="Recent Activity" columns={columns} data={tableData} paginationEnabled={false} />
    );
}
