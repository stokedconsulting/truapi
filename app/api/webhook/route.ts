import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/database'
import crypto from 'crypto'
import { InvoiceModel } from '@/models/Invoice.model'
import { CheckoutSessionModel } from '@/models/CheckoutSession.model'
import { formatUnits } from 'viem'
import { getWalletFromData, unlistenToAddress } from '@/lib/coinbase'
import { tokenAddresses } from '@/config'
import { UserDocument } from '@/models/User.model'
import { Coinbase } from '@coinbase/coinbase-sdk'
import { invoicePaymentConfirmationEmail, invoicePartialPaymentEmail } from '@/config/emailTemplates'
import { sendEmail } from '@/lib/aws'
import "@/models";
import { UserModel } from '@/models/User.model'

// @review - Push webhook requests to queue for internal processing?

export async function POST(request: NextRequest) {
    try {
        const signature = request.headers.get('x-coinbase-signature')
        if (!signature)
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

        const rawBody = await request.text()
        const payload = JSON.parse(rawBody)
        const webhookId = payload?.webhookId
        if (!webhookId)
            return NextResponse.json({ error: 'Missing webhookId' }, { status: 400 })

        const hmac = crypto.createHmac('sha256', webhookId)
        hmac.update(rawBody)
        const calculatedSignature = hmac.digest('hex')
        if (!crypto.timingSafeEqual(Buffer.from(calculatedSignature, 'hex'), Buffer.from(signature, 'hex'))) {
            return NextResponse.json({ error: 'Signature mismatch' }, { status: 403 })
        }

        console.log('[POST /api/webhook] Payload:', payload);

        await connectToDatabase()
        const toAddr = payload?.to
        const txHash = payload?.transactionHash
        const datePaid = new Date(payload?.blockTime)
        const amount = formatUnits(payload?.value || 0, 6)
        if (!toAddr || !txHash || !amount)
            return NextResponse.json({ error: 'Invalid or missing fields' }, { status: 400 })

        if (payload?.contractAddress.toLowerCase() != (process.env.NEXT_PUBLIC_APP_ENV === "production" ? tokenAddresses.USDC['base-mainnet'] : tokenAddresses.USDC['base-sepolia']).toLowerCase()) {
            console.log('[POST /api/webhook] Unsupported token, skipping');
            return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });
        }

        // Check for existing payment with same transaction hash
        const existingInvoice = await InvoiceModel.findOne({ 
            "payments.transactionHash": new RegExp(txHash, 'i')
        });
        const existingSession = await CheckoutSessionModel.findOne({ 
            "payment.transactionHash": new RegExp(txHash, 'i')
        });

        if (existingInvoice || existingSession) {
            console.log(`[POST /api/webhook] Payment with txHash ${txHash} already processed`);
            return NextResponse.json({ message: 'Payment already processed' }, { status: 200 });
        }

        let invoice = await InvoiceModel.findOne({ "wallet.address": new RegExp(toAddr, 'i') }).populate('userId');
        if (invoice) {
            console.log("Invoice found: ", invoice._id);
            
            // Calculate total payments including existing ones
            const existingTotal = invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
            const paymentAmount = Number(amount);
            const totalWithNew = existingTotal + paymentAmount;
            
            // Validate total payment amount but still process if it exceeds
            const totalPrice = invoice.invoiceItems.reduce((sum, val) => sum + val.price, 0);
            if (totalWithNew > totalPrice) {
                console.log(`[POST /api/webhook] Payment amount ${totalWithNew} exceeds invoice total ${totalPrice}, marking as paid`);
            }

            // Start a transaction to ensure atomicity
            const session = await InvoiceModel.startSession();
            session.startTransaction();
            
            try {
                invoice.payments.push({
                    name: invoice.name,
                    email: invoice.email,
                    amount,
                    transactionHash: txHash,
                    paidAt: datePaid
                });

                // Update status based on total payments - mark as paid if total exceeds
                if (totalWithNew >= totalPrice)
                    invoice.status = 'paid';
                else
                    invoice.status = 'partially paid';
                
                await invoice.save({ session });

                // Unlisten if fully paid or exceeded
                if (totalWithNew >= totalPrice)
                    await unlistenToAddress(toAddr);

                const wallet = await getWalletFromData(invoice.wallet?.id as string, invoice.wallet?.seed as string);
                const transfer = await wallet.createTransfer({
                    destination: (invoice.userId as unknown as UserDocument)?.wallet?.address as string,
                    amount: paymentAmount,
                    assetId: Coinbase.assets.Usdc,
                    gasless: true
                });
                await transfer.wait({ timeoutSeconds: 120 });

                // Send emails based on payment status
                if (totalWithNew >= totalPrice) {
                    // Send full payment confirmation to payer
                    await sendEmail(
                        invoice.email,
                        "Payment Confirmation",
                        invoicePaymentConfirmationEmail(
                            invoice.id,
                            amount,
                            datePaid.toISOString()
                        )
                    );

                    // Send payment notification to invoice owner
                    const invoiceOwner = await UserModel.findById(invoice.userId);
                    if (invoiceOwner?.email) {
                        await sendEmail(
                            invoiceOwner.email,
                            "New Payment Received",
                            invoicePaymentConfirmationEmail(
                                invoice.id,
                                amount,
                                datePaid.toISOString(),
                                true
                            )
                        );
                    }
                } else {
                    // Send partial payment notification to payer
                    await sendEmail(
                        invoice.email,
                        "Partial Payment Received",
                        invoicePartialPaymentEmail(
                            invoice.id,
                            amount,
                            totalPrice.toString(),
                            (totalPrice - totalWithNew).toString(),
                            datePaid.toISOString()
                        )
                    );

                    // Send partial payment notification to invoice owner
                    const invoiceOwner = await UserModel.findById(invoice.userId);
                    if (invoiceOwner?.email) {
                        await sendEmail(
                            invoiceOwner.email,
                            "Partial Payment Received",
                            invoicePaymentConfirmationEmail(
                                invoice.id,
                                amount,
                                datePaid.toISOString(),
                                true
                            )
                        );
                    }
                }

                await session.commitTransaction();
                return NextResponse.json({ message: 'Payment recorded for invoice' }, { status: 200 });
            } catch (error) {
                await session.abortTransaction();
                throw error;
            } finally {
                session.endSession();
            }
        }

        const session = await CheckoutSessionModel.findOne({ "wallet.address": new RegExp(toAddr, 'i') });
        if (session) {
            console.log("Session found: ", session._id);
            invoice = await InvoiceModel.findById(session.invoiceId).populate('userId');
            if (invoice) {
                // Calculate total payments including existing ones
                const existingTotal = invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
                const paymentAmount = Number(amount);
                const totalWithNew = existingTotal + paymentAmount;
                
                // Validate total payment amount but still process if it exceeds
                const totalPrice = invoice.invoiceItems.reduce((sum, val) => sum + val.price, 0);
                if (totalWithNew > totalPrice) {
                    console.log(`[POST /api/webhook] Payment amount ${totalWithNew} exceeds invoice total ${totalPrice}, marking as paid`);
                }

                // Start a transaction to ensure atomicity
                const dbSession = await CheckoutSessionModel.startSession();
                dbSession.startTransaction();
                
                try {
                    invoice.payments.push({
                        name: session.name,
                        email: session.email,
                        amount,
                        transactionHash: txHash,
                        paidAt: datePaid,
                        checkoutSession: session._id
                    });
                    
                    session.payment = {
                        name: session.name,
                        email: session.email,
                        amount: paymentAmount,
                        transactionHash: txHash,
                        paidAt: datePaid
                    };

                    // Update status based on total payments - mark as paid if total exceeds
                    if (totalWithNew >= totalPrice)
                        session.status = 'paid';
                    else
                        session.status = 'partially paid';
                    
                    await session.save({ session: dbSession });
                    await invoice.save({ session: dbSession });

                    // Unlisten if fully paid or exceeded
                    if (totalWithNew >= totalPrice)
                        await unlistenToAddress(toAddr);

                    const wallet = await getWalletFromData(session.wallet?.id as string, session.wallet?.seed as string);
                    const transfer = await wallet.createTransfer({
                        destination: (invoice.userId as unknown as UserDocument)?.wallet?.address as string,
                        amount: paymentAmount,
                        assetId: Coinbase.assets.Usdc,
                        gasless: true
                    });
                    await transfer.wait({ timeoutSeconds: 120 });

                    // Send emails based on payment status
                    if (totalWithNew >= totalPrice) {
                        // Send full payment confirmation to payer
                        await sendEmail(
                            session.email,
                            "Payment Confirmation",
                            invoicePaymentConfirmationEmail(
                                invoice.id,
                                amount,
                                datePaid.toISOString()
                            )
                        );

                        // Send payment notification to invoice owner
                        const invoiceOwner = await UserModel.findById(invoice.userId);
                        if (invoiceOwner?.email) {
                            await sendEmail(
                                invoiceOwner.email,
                                "New Payment Received",
                                invoicePaymentConfirmationEmail(
                                    invoice.id,
                                    amount,
                                    datePaid.toISOString(),
                                    true
                                )
                            );
                        }
                    } else {
                        // Send partial payment notification to payer
                        await sendEmail(
                            session.email,
                            "Partial Payment Received",
                            invoicePartialPaymentEmail(
                                invoice.id,
                                amount,
                                totalPrice.toString(),
                                (totalPrice - totalWithNew).toString(),
                                datePaid.toISOString()
                            )
                        );

                        // Send partial payment notification to invoice owner
                        const invoiceOwner = await UserModel.findById(invoice.userId);
                        if (invoiceOwner?.email) {
                            await sendEmail(
                                invoiceOwner.email,
                                "Partial Payment Received",
                                invoicePaymentConfirmationEmail(
                                    invoice.id,
                                    amount,
                                    datePaid.toISOString(),
                                    true
                                )
                            );
                        }
                    }

                    await dbSession.commitTransaction();
                    return NextResponse.json({ message: 'Payment recorded for multi-use invoice' }, { status: 200 });
                } catch (error) {
                    await dbSession.abortTransaction();
                    throw error;
                } finally {
                    dbSession.endSession();
                }
            }
        }

        return NextResponse.json({ message: 'No matching invoice or session found' }, { status: 200 })
    } catch (err: any) {
        console.error('[POST /api/webhook] Error:', err)
        return NextResponse.json({ message: 'Webhook processing failed' }, { status: 200 })
    }
}
