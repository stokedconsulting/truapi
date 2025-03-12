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
import { invoicePaymentConfirmationEmail } from '@/config/emailTemplates'
import { sendEmail } from '@/lib/aws'
import "@/models";

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
        // @todo - Dynamic based on token being accepted
        const amount = formatUnits(payload?.value || 0, 6)
        if (!toAddr || !txHash || !amount)
            return NextResponse.json({ error: 'Invalid or missing fields' }, { status: 400 })

        if (payload?.contractAddress.toLowerCase() != (process.env.NEXT_APP_ENV === "production" ? tokenAddresses.USDC['base-mainnet'] : tokenAddresses.USDC['base-sepolia']).toLowerCase())
            return NextResponse.json({ error: 'Unsupported token' }, { status: 200 })

        let invoice = await InvoiceModel.findOne({ "wallet.address": new RegExp(toAddr, 'i') }).populate('userId');
        if (invoice) {
            console.log("Invoice found: ", invoice._id);
            invoice.payments.push({
                name: invoice.name,
                email: invoice.email,
                amount,
                transactionHash: txHash
            })
            const totalPrice = invoice.invoiceItems.reduce((sum, val) => sum + val.price, 0);
            if (Number(amount) >= totalPrice)
                invoice.status = 'paid';
            else
                invoice.status = 'partially paid';
            await invoice.save()
            if (invoice.paymentCollection === "one-time")
                await unlistenToAddress(toAddr)

            const wallet = await getWalletFromData(invoice.wallet?.id as string, invoice.wallet?.seed as string);
            const transfer = await wallet.createTransfer({
                destination: (invoice.userId as unknown as UserDocument)?.wallet?.address as string,
                amount: Number(amount),
                assetId: Coinbase.assets.Usdc,
                gasless: true
            });
            await transfer.wait({ timeoutSeconds: 120 });

            sendEmail(
                invoice.email,
                "Invoice Payment Confirmation",
                invoicePaymentConfirmationEmail(
                    invoice.id,
                    amount,
                    datePaid.toISOString()
                )
            );

            return NextResponse.json({ message: 'Payment recorded for invoice' }, { status: 200 })
        }

        const session = await CheckoutSessionModel.findOne({ "wallet.address": new RegExp(toAddr, 'i') })
        if (session) {
            console.log("Session found: ", session._id);
            invoice = await InvoiceModel.findById(session.invoiceId).populate('userId')
            if (invoice) {
                invoice.payments.push({
                    name: session.name,
                    email: session.email,
                    amount,
                    transactionHash: txHash
                })
                session.payment = {
                    name: session.name,
                    email: session.email,
                    amount: Number(amount),
                    transactionHash: txHash,
                    paidAt: payload?.blockTime
                }
                const totalPrice = invoice.invoiceItems.reduce((sum, val) => sum + val.price, 0);
                if (Number(amount) >= totalPrice)
                    session.status = 'paid';
                else
                    session.status = 'partially paid';
                await session.save()
                await invoice.save()
                await unlistenToAddress(toAddr);

                const wallet = await getWalletFromData(session.wallet?.id as string, session.wallet?.seed as string);
                const transfer = await wallet.createTransfer({
                    destination: (invoice.userId as unknown as UserDocument)?.wallet?.address as string,
                    amount: Number(amount),
                    assetId: Coinbase.assets.Usdc,
                    gasless: true
                });
                await transfer.wait({ timeoutSeconds: 120 });

                sendEmail(
                    session.email,
                    "Invoice Payment Confirmation",
                    invoicePaymentConfirmationEmail(
                        invoice.id,
                        amount,
                        datePaid.toISOString()
                    )
                );

                return NextResponse.json({ message: 'Payment recorded for multi-use invoice' }, { status: 200 })
            }
        }

        return NextResponse.json({ message: 'No matching invoice or session found' }, { status: 404 })
    } catch (err: any) {
        console.error('[POST /api/webhook] Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
