"use client";

import React, { useState } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
    ColumnDef,
    SortingState,
} from "@tanstack/react-table";
import styles from "./CustomTable.module.scss";

interface TableProps<T> {
    title: string,
    columns: ColumnDef<T, any>[];
    data: T[];
    paginationEnabled?: boolean;
    searchEnabled?: boolean
}

const CustomTable = <T,>({ title, columns, data, paginationEnabled = true, searchEnabled = false }: TableProps<T>) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
    });

    return (
        <div className={styles.tableContainer}>
            <div className={styles.header}>
                <h3>{title}</h3>
                {/* Search Box */}
                {searchEnabled && <input
                    type="text"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search a transaction..."
                    className={styles.searchInput}
                />}
            </div>

            {/* Table */}
            <table className={styles.table}>
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    onClick={header.column.getToggleSortingHandler()}
                                    className={styles.sortableHeader}
                                >
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                    {header.column.getIsSorted() === "asc" ? " 🔼" : ""}
                                    {header.column.getIsSorted() === "desc" ? " 🔽" : ""}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination Controls */}
            {paginationEnabled && <div className={styles.pagination}>
                <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                    {"<<"}
                </button>
                <span>
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    {">>"}
                </button>
            </div>}
        </div>
    );
};

export default CustomTable;
