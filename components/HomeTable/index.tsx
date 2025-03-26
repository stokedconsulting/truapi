"use client";

import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import CustomTable from "../CustomTable";
import { useGetRecentActivity } from "@/hooks/useGetRecentActivity";
import { formatNumber, shortAddress } from "@/lib/utils";
import styles from "./HomeTable.module.scss";

interface ActivityRow {
    date: string;
    type: string;
    amount: string;
    nameOrAddress: string;
    direction: string;
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
        accessorKey: "direction",
        header: "Direction",
        cell: ({ getValue }) => {
            const direction = getValue() as string;
            return (
                <span className={`${styles.direction} ${styles[direction.toLowerCase()]}`}>
                    {direction}
                </span>
            );
        },
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
];

export default function RecentActivityTable() {
    const { data, isLoading, isFetching } = useGetRecentActivity();

    const tableData = useMemo<ActivityRow[]>(() => {
        const activity = data?.activity || [];
        return activity.map((item) => {
            const dateStr = new Date(item.timestamp as number).toLocaleString();
            const assetStr = item.asset || "";
            const amountStr = `${formatNumber(item.amount || 0)} ${assetStr.toUpperCase()}`;
            // @ts-ignore
            let nameOrAddress = item.name || item.email || shortAddress(item.address, 10) || "N/A";

            return {
                date: dateStr,
                type: item.type.toUpperCase(),
                amount: amountStr,
                nameOrAddress,
                direction: item.direction,
                transactionHash: item.transactionHash || undefined,
            };
        });
    }, [data]);

    return (
        <CustomTable title="Recent Activity"
            columns={columns}
            data={tableData}
            paginationEnabled={false}
            isLoading={isLoading || isFetching} />
    );
}
