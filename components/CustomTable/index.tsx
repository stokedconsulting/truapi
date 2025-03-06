"use client";

import React, { useState } from "react";
import {
    ColumnDef,
    SortingState,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    Table,
    flexRender,
    Row,
} from "@tanstack/react-table";
import styles from "./CustomTable.module.scss";

interface TableProps<T> {
    title: string;
    table?: Table<T>;
    columns?: ColumnDef<T, any>[];
    data?: T[];
    paginationEnabled?: boolean;
    searchEnabled?: boolean;
    rowOnClick?: (row: Row<T>) => void
}

function CustomTable<T>({
    title,
    table: externalTable,
    columns,
    data,
    paginationEnabled = true,
    searchEnabled = false,
    rowOnClick
}: TableProps<T>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");

    const internalTable =
        !externalTable && columns && data
            ? useReactTable<T>({
                data,
                columns,
                state: {
                    sorting,
                    globalFilter,
                },
                onSortingChange: setSorting,
                onGlobalFilterChange: setGlobalFilter,
                getCoreRowModel: getCoreRowModel(),
                getSortedRowModel: getSortedRowModel(),
                getPaginationRowModel: getPaginationRowModel(),
            })
            : undefined;

    const table = externalTable || internalTable;

    if (!table) {
        return (
            <div className={styles.tableContainer}>
                <div className={styles.header}>
                    <h3>{title}</h3>
                </div>
                <p>No table data.</p>
            </div>
        );
    }

    const pageIndex = table.getState().pagination?.pageIndex || 0;
    const pageCount = table.getPageCount();

    return (
        <div className={styles.tableContainer}>
            <div className={styles.header}>
                <h3>{title}</h3>

                {searchEnabled && (
                    <input
                        type="text"
                        value={table.getState().globalFilter ?? ""}
                        onChange={(e) => table.setGlobalFilter(e.target.value)}
                        placeholder="Search..."
                        className={styles.searchInput}
                    />
                )}
            </div>
            <div className={styles.innerTableContainer}>
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
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                        {{
                                            asc: " 🔼",
                                            desc: " 🔽",
                                        }[header.column.getIsSorted() as string] ?? null}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id} style={rowOnClick ? { "cursor": "pointer" } : {}} onClick={() => { rowOnClick ? rowOnClick(row) : null }}>
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {
                paginationEnabled && (
                    <div className={styles.pagination}>
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            {"<"}
                        </button>
                        <span>
                            Page {pageIndex + 1} of {pageCount}
                        </span>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            {">"}
                        </button>
                    </div>
                )
            }
        </div >
    );
}

export default CustomTable;
