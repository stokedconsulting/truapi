import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/database";
import { InvoiceDocument, InvoiceModel } from "@/models/Invoice.model";
import { CheckoutSessionModel } from "@/models/CheckoutSession.model";
import { getWalletFromData, unlistenToAddress } from "@/lib/coinbase";
import { tokenAddresses } from "@/config";
import { sendEmail } from "@/lib/aws";
import { invoicePaymentConfirmationEmail } from "@/config/emailTemplates";
import { UserDocument } from "@/models/User.model";
import { Coinbase, TransactionStatus } from "@coinbase/coinbase-sdk";
import "@/models";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const invoiceId = searchParams.get("invoiceId");
        const checkoutId = searchParams.get("checkoutId");

        if (!invoiceId && !checkoutId) {
            return NextResponse.json(
                { error: "Missing invoiceId or checkoutId" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        let invoice: InvoiceDocument & { userId: UserDocument } | null = null;
        let session = null;
        let walletId = "";
        let address = "";
        let encryptedSeed = "";
        let documentId: string;
        let txHash = "";

        if (invoiceId) {
            invoice = await InvoiceModel.findById(invoiceId).populate("userId") as any;
            if (!invoice) {
                return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
            }
            if (!invoice.wallet?.id || !invoice.wallet?.address || !invoice.wallet?.seed) {
                return NextResponse.json({ error: "Invoice wallet missing" }, { status: 400 });
            }
            walletId = invoice.wallet.id;
            address = invoice.wallet.address;
            encryptedSeed = invoice.wallet.seed;
            documentId = invoiceId;
        } else {
            session = await CheckoutSessionModel.findById(checkoutId);
            if (!session) {
                return NextResponse.json({ error: "Checkout session not found" }, { status: 404 });
            }
            if (!session.wallet?.id || !session.wallet?.address || !session.wallet?.seed) {
                return NextResponse.json({ error: "Session wallet missing" }, { status: 400 });
            }
            walletId = session.wallet.id;
            address = session.wallet.address;
            encryptedSeed = session.wallet.seed;
            documentId = checkoutId!;

            invoice = await InvoiceModel.findById(session.invoiceId).populate("userId") as any;
            if (!invoice) {
                return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
            }
        }

        if (session?.status === "paid")
            return NextResponse.json({ message: `Already paid`, }, { status: 200 });
        if (invoice?.status === "paid")
            return NextResponse.json({ message: `Already paid`, }, { status: 200 });

        const wallet = await getWalletFromData(walletId, encryptedSeed);

        const defaultAddress = await wallet.getDefaultAddress();
        const txResp = await defaultAddress.listTransactions({ limit: 50 });
        const allTx = txResp.data;

        const usdcContract =
            process.env.NEXT_APP_ENV === "production"
                ? tokenAddresses.USDC["base-mainnet"]
                : tokenAddresses.USDC["base-sepolia"];

        let totalPaid = 0;

        for (const tx of allTx) {
            const status = tx.getStatus();
            if (status !== TransactionStatus.COMPLETE) {
                continue;
            }

            const content = tx.content();
            if (!content || !("token_transfers" in content)) {
                continue; 
            }

            const { token_transfers } = content as any;
            if (!Array.isArray(token_transfers)) {
                continue;
            }

            for (const t of token_transfers) {
                if (
                    t.contract_address?.toLowerCase() === usdcContract.toLowerCase() &&
                    t.to_address?.toLowerCase() === address.toLowerCase()
                ) {
                    const rawValue = parseFloat(t.value);
                    const decimals = 6;
                    const paidAmount = rawValue / Math.pow(10, decimals);
                    totalPaid += paidAmount;
                    txHash = tx.getTransactionHash() || "";
                }
            }
        }

        const totalPrice = invoice.invoiceItems
            ? invoice.invoiceItems.reduce((sum: number, item: any) => sum + (item.price || 0), 0)
            : 0;

        if (totalPaid > 0) {
            console.log(`[check-payment] Found new payment of ${totalPaid} USDC for doc: ${documentId}`);

            if (invoiceId) {
                if (totalPaid >= totalPrice) {
                    invoice.status = "paid";
                } else {
                    invoice.status = "partially paid";
                }
                invoice.payments.push({
                    name: invoice.name,
                    email: invoice.email,
                    amount: totalPaid.toString(),
                    transactionHash: txHash,
                });
                await invoice.save();
            } else if (session && invoice) {
                if (totalPaid >= totalPrice) {
                    session.status = "paid";
                } else {
                    session.status = "partially paid";
                }
                session.payment = {
                    name: session.name,
                    email: session.email,
                    amount: totalPaid,
                    transactionHash: txHash,
                    paidAt: new Date(),
                };
                await session.save();

                invoice.payments.push({
                    name: session.name,
                    email: session.email,
                    amount: totalPaid.toString(),
                    transactionHash: session.payment.transactionHash,
                });
                await invoice.save();
            }

            if (totalPaid >= totalPrice) {
                console.log(`[check-payment] Fully paid. Unlistening from: ${address}`);
                await unlistenToAddress(address);
            }

            const invoiceOwner = invoice.userId;
            if (invoiceOwner?.wallet?.address) {
                const transfer = await wallet.createTransfer({
                    destination: invoiceOwner.wallet.address,
                    // @todo - transfer wallet balance out instead of totalAmount
                    amount: totalPaid,
                    assetId: Coinbase.assets.Usdc,
                    gasless: true
                });
                await transfer.wait({ timeoutSeconds: 120 });
            }

            await sendEmail(
                (invoiceId ? invoice.email : session?.email) || "",
                "Invoice Payment Confirmation",
                invoicePaymentConfirmationEmail(
                    invoice._id?.toString() || "",
                    totalPaid.toString(),
                    new Date().toISOString()
                )
            );

            return NextResponse.json(
                {
                    message: `Payment found. Marked invoice/session as paid/partial. totalPaid=${totalPaid}`,
                },
                { status: 200 }
            );
        } else {
            return NextResponse.json(
                { message: "No new payments found." },
                { status: 200 }
            );
        }
    } catch (err: any) {
        console.error("[GET /api/invoices/check-payment] Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
