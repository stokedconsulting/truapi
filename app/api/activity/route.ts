import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/database";
import { UserModel } from "@/models/User.model";
import { InvoiceModel } from "@/models/Invoice.model";
import { CheckoutSessionModel } from "@/models/CheckoutSession.model";
import { getWalletFromUser } from "@/lib/coinbase";
import { fetchTxTimestamp } from "@/lib/viem";
import { PaymentActivity, TransferActivity } from "@/types/api.types";
import "@/models";

// @todo - fix sorting, older transfers show up at the start and new invoice payments at the bottom

export async function GET(request: NextRequest) {
    try {
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const user = await UserModel.findOne({ userId });
        if (!user || !user.wallet?.id) {
            return NextResponse.json({ error: "User Not Found" }, { status: 404 });
        }

        const wallet = await getWalletFromUser(user);
        const address = await wallet.getDefaultAddress();

        const transfersResp = await address.listTransfers({ limit: 10 });
        const transfers = transfersResp.data;

        const transferActivities: TransferActivity[] = [];

        for await (const _transfer of transfers) {
            let createdDate: Date | null = null;
            // Wait for the transfer to be confirmed and use latest transfer inforamtion
            const transfer = await _transfer.wait();
            const txHash = transfer.getTransactionHash();
            const tx = transfer.getTransaction();

            if (tx && (tx as any).timestamp) {
                createdDate = new Date((tx as any).timestamp * 1000);
            } else if (txHash) {
                createdDate = await fetchTxTimestamp(txHash);
            }

            // Skip transfers where we couldn't get a valid timestamp
            if (!createdDate) {
                console.warn(`Could not get timestamp for transfer ${txHash || 'unknown'}`);
                continue;
            }

            transferActivities.push({
                type: "transfer",
                timestamp: createdDate.getTime(),
                amount: transfer.getAmount().toNumber(),
                asset: transfer.getAssetId(),
                status: transfer.getStatus(),
                address: transfer.getDestinationAddressId(),
                transactionHash: transfer.getTransactionHash() || null,
                direction: transfer.getDestinationAddressId() === address.getId() ? "IN" : "OUT"
            });
        }

        const allPaymentActivities: PaymentActivity[] = [];

        const invoices = await InvoiceModel.find({ userId: user._id });
        for (const inv of invoices) {
            for (const pay of inv.payments) {
                const paidDate = new Date(pay.paidAt);
                allPaymentActivities.push({
                    type: "invoicePayment",
                    timestamp: paidDate.getTime(),
                    amount: pay.amount,
                    asset: inv.paymentAsset,
                    status: inv.status,
                    invoiceId: inv._id as string,
                    transactionHash: pay.transactionHash || null,
                    name: pay.name || inv.name,
                    email: pay.email || inv.email,
                    direction: "IN"
                });
            }
        }

        const sessions = await CheckoutSessionModel.find({
            invoiceId: { $in: invoices.map((i) => i._id) },
        });
        for (const ses of sessions) {
            if (ses.payment?.amount) {
                const paidDate = new Date(ses.payment.paidAt);
                allPaymentActivities.push({
                    type: "checkoutPayment",
                    timestamp: paidDate.getTime(),
                    amount: ses.payment.amount,
                    asset: "USDC",
                    status: ses.status,
                    invoiceId: ses.invoiceId.toString(),
                    transactionHash: ses.payment.transactionHash || null,
                    name: ses.payment.name || ses.name,
                    email: ses.payment.email || ses.email,
                    direction: "IN"
                });
            }
        }

        // Sort all activities by timestamp in descending order (newest first)
        const combined = [...transferActivities, ...allPaymentActivities];
        combined.sort((a, b) => b.timestamp - a.timestamp);

        // Take only the 10 most recent activities
        const finalActivity = combined.slice(0, 10).map((item) => ({
            ...item,
            date: new Date(item.timestamp).toISOString(),
        }));

        console.log(finalActivity);

        return NextResponse.json({ activity: finalActivity }, { status: 200 });
    } catch (error: any) {
        console.error("[GET /api/activity] Failed to list recent activity:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
