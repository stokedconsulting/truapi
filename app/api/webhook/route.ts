import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/database'
import crypto from 'crypto'
import { InvoiceModel } from '@/models/Invoice.model'
import { CheckoutSessionModel } from '@/models/CheckoutSession.model'
import { formatEther, formatUnits } from 'viem'
import { unlistenToAddress } from '@/lib/coinbase'

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
        // @todo - Dynamic based on token being accepted
        const amount = formatUnits(payload?.value || 0, 6)
        if (!toAddr || !txHash || !amount)
            return NextResponse.json({ error: 'Invalid or missing fields' }, { status: 400 })

        let invoice = await InvoiceModel.findOne({ "wallet.address": new RegExp(toAddr, 'i') })
        if (invoice) {
            invoice.payments.push({
                name: invoice.name,
                email: invoice.email,
                amount,
                transactionHash: txHash
            })
            await invoice.save()
            if (invoice.paymentCollection === "one-time")
                await unlistenToAddress(toAddr)
            return NextResponse.json({ message: 'Payment recorded for invoice' }, { status: 200 })
        }

        const session = await CheckoutSessionModel.findOne({ "wallet.address": new RegExp(toAddr, 'i') })
        if (session) {
            invoice = await InvoiceModel.findById(session.invoiceId)
            if (invoice) {
                invoice.payments.push({
                    name: session.name,
                    email: session.email,
                    amount,
                    transactionHash: txHash
                })
                await invoice.save()
                await unlistenToAddress(toAddr);
                return NextResponse.json({ message: 'Payment recorded for multi-use invoice' }, { status: 200 })
            }
        }

        return NextResponse.json({ message: 'No matching invoice or session found' }, { status: 404 })
    } catch (err: any) {
        console.error('[POST /api/webhook] Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
