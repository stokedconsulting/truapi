import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/database";
import { InvoiceDocument, InvoiceModel } from "@/models/Invoice.model";
import { CheckoutSessionModel } from "@/models/CheckoutSession.model";
import { getWalletFromData, unlistenToAddress } from "@/lib/coinbase";
import { tokenAddresses } from "@/config";
import { sendEmail } from "@/lib/aws";
import { invoicePaymentConfirmationEmail, invoicePartialPaymentEmail } from "@/config/emailTemplates";
import { UserDocument } from "@/models/User.model";
import { Coinbase, TransactionStatus } from "@coinbase/coinbase-sdk";
import "@/models";
import { UserModel } from "@/models/User.model";

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
        let newTxHash = "";
        let newPayments = [];

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
                    
                    // Check if this transaction has already been processed
                    const existingPayment = invoice.payments.find(
                        (p: any) => p.transactionHash?.toLowerCase() === tx.getTransactionHash()?.toLowerCase()
                    );
                    
                    if (!existingPayment) {
                        totalPaid += paidAmount;
                        newTxHash = tx.getTransactionHash() || "";
                        newPayments.push({
                            amount: paidAmount,
                            transactionHash: newTxHash,
                            paidAt: new Date()
                        });
                    }
                }
            }
        }

        if (newPayments.length > 0) {
            console.log(`[check-payment] Found ${newPayments.length} new payment(s) totaling ${totalPaid} USDC for doc: ${documentId}`);

            const totalPrice = invoice.invoiceItems
                ? invoice.invoiceItems.reduce((sum: number, item: any) => sum + (item.price || 0), 0)
                : 0;

            // Calculate total payments including existing ones
            const existingTotal = invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
            const totalWithNew = existingTotal + totalPaid;

            // Validate total payment amount but still process if it exceeds
            if (totalWithNew > totalPrice) {
                console.log(`[check-payment] Payment amount ${totalWithNew} exceeds invoice total ${totalPrice}, marking as paid`);
            }

            // Start a transaction to ensure atomicity
            const dbSession = await InvoiceModel.startSession();
            dbSession.startTransaction();

            try {
                if (invoiceId) {
                    // Update status based on total payments - mark as paid if total exceeds
                    if (totalWithNew >= totalPrice) {
                        invoice.status = "paid";
                    } else {
                        invoice.status = "partially paid";
                    }

                    // Add all new payments
                    for (const payment of newPayments) {
                        invoice.payments.push({
                            name: invoice.name,
                            email: invoice.email,
                            amount: payment.amount.toString(),
                            transactionHash: payment.transactionHash,
                            paidAt: payment.paidAt
                        });
                    }
                    await invoice.save({ session: dbSession });
                } else if (session && invoice) {
                    // Update status based on total payments - mark as paid if total exceeds
                    if (totalWithNew >= totalPrice) {
                        session.status = "paid";
                    } else {
                        session.status = "partially paid";
                    }

                    // Update session payment with the latest payment
                    const latestPayment = newPayments[newPayments.length - 1];
                    session.payment = {
                        name: session.name,
                        email: session.email,
                        amount: totalPaid,
                        transactionHash: latestPayment.transactionHash,
                        paidAt: latestPayment.paidAt
                    };
                    await session.save({ session: dbSession });

                    // Add all new payments to invoice
                    for (const payment of newPayments) {
                        invoice.payments.push({
                            name: session.name,
                            email: session.email,
                            amount: payment.amount.toString(),
                            transactionHash: payment.transactionHash,
                            paidAt: payment.paidAt,
                            checkoutSession: session._id
                        });
                    }
                    await invoice.save({ session: dbSession });
                }

                // Only unlisten if fully paid or exceeded
                if (totalWithNew >= totalPrice) {
                    console.log(`[check-payment] Fully paid. Unlistening from: ${address}`);
                    await unlistenToAddress(address);
                }

                const invoiceOwner = invoice.userId;
                if (invoiceOwner?.wallet?.address) {
                    const transfer = await wallet.createTransfer({
                        destination: invoiceOwner.wallet.address,
                        amount: totalPaid,
                        assetId: Coinbase.assets.Usdc,
                        gasless: true
                    });
                    await transfer.wait({ timeoutSeconds: 120 });
                }

                // Send emails based on payment status
                if (totalWithNew >= totalPrice) {
                    // Send full payment confirmation to payer
                    await sendEmail(
                        (invoiceId ? invoice.email : session?.email) || "",
                        "Payment Confirmation",
                        invoicePaymentConfirmationEmail(
                            invoice._id?.toString() || "",
                            totalPaid.toString(),
                            new Date().toISOString()
                        )
                    );

                    // Send payment notification to invoice owner
                    const invoiceOwner = await UserModel.findById(invoice.userId);
                    if (invoiceOwner?.email) {
                        await sendEmail(
                            invoiceOwner.email,
                            "New Payment Received",
                            invoicePaymentConfirmationEmail(
                                invoice._id?.toString() || "",
                                totalPaid.toString(),
                                new Date().toISOString(),
                                true
                            )
                        );
                    }
                } else {
                    // Send partial payment notification to payer
                    await sendEmail(
                        (invoiceId ? invoice.email : session?.email) || "",
                        "Partial Payment Received",
                        invoicePartialPaymentEmail(
                            invoice._id?.toString() || "",
                            totalPaid.toString(),
                            totalPrice.toString(),
                            (totalPrice - totalWithNew).toString(),
                            new Date().toISOString()
                        )
                    );

                    // Send partial payment notification to invoice owner
                    const invoiceOwner = await UserModel.findById(invoice.userId);
                    if (invoiceOwner?.email) {
                        await sendEmail(
                            invoiceOwner.email,
                            "Partial Payment Received",
                            invoicePaymentConfirmationEmail(
                                invoice._id?.toString() || "",
                                totalPaid.toString(),
                                new Date().toISOString(),
                                true
                            )
                        );
                    }
                }

                await dbSession.commitTransaction();
                return NextResponse.json(
                    {
                        message: `Payment(s) found. Marked invoice/session as paid/partial. totalPaid=${totalPaid}, totalWithExisting=${totalWithNew}`,
                    },
                    { status: 200 }
                );
            } catch (error) {
                await dbSession.abortTransaction();
                throw error;
            } finally {
                dbSession.endSession();
            }
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
