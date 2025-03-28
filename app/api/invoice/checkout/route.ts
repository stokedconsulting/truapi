import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/database'
import { InvoiceModel } from '@/models/Invoice.model'
import { CheckoutSessionModel } from '@/models/CheckoutSession.model'
import { createWallet, listenToAddress } from '@/lib/coinbase'
import "@/models";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { invoiceId, name, email } = body
        if (!invoiceId || !name || !email)
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

        await connectToDatabase()
        const invoice = await InvoiceModel.findById(invoiceId)
        if (!invoice)
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        if (invoice.paymentCollection !== "multi-use")
            return NextResponse.json({ error: 'Not allowed for one-time invoice' }, { status: 400 })
        if (invoice.status == "void")
            return NextResponse.json({ error: 'Invoice not active' }, { status: 400 })

        const exists = await CheckoutSessionModel.findOne({ invoiceId, email })
        if (exists)
            return NextResponse.json({ error: 'Email already used for this invoice' }, { status: 400 })

        const { wallet, encryptedSeed } = await createWallet()
        const addr = await wallet.getDefaultAddress()
        const session = await CheckoutSessionModel.create({
            invoiceId,
            name,
            email,
            wallet: {
                id: wallet.getId(),
                address: addr.getId(),
                seed: encryptedSeed
            }
        })
        await listenToAddress(addr.getId())
        return NextResponse.json(session, { status: 201 })
    } catch (error: any) {
        console.error('[POST /api/checkout-sessions] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id)
            return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
        await connectToDatabase()
        const session = await (await (await CheckoutSessionModel.findById(id))?.populate('invoiceId'))?.populate({ path: 'invoiceId.userId', select: 'name' })
        if (!session)
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        return NextResponse.json(session, { status: 200 })
    } catch (error: any) {
        console.error('[GET /api/checkout-sessions] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
