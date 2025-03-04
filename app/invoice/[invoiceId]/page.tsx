"use client"

import { useParams } from "next/navigation";

export default function Page() {
    const { invoiceId } = useParams<{ invoiceId: string }>();

    return (
        <div>
            INVOICE ID: {invoiceId}
        </div>
    )
}