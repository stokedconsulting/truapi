import { NextRequest, NextResponse } from 'next/server'
// import { getAuth } from '@clerk/nextjs/server'
import connectToDatabase from '@/lib/database'
import { InvoiceModel } from '@/models/Invoice.model'
import { CheckoutSessionModel } from '@/models/CheckoutSession.model'
import { createWallet, listenToAddress } from '@/lib/coinbase'

export async function POST(request: NextRequest) {
    try {
        // @review - Non users can pay invoices
        // const { userId } = getAuth(request)
        // if (!userId)
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
                address: addr.getId(),
                seed: encryptedSeed
            }
        })
        // @review - Unlisten when session expires
        // @review - Mongodb session/transaction setup
        await listenToAddress(addr.getId())
        return NextResponse.json(session, { status: 201 })
    } catch (error: any) {
        console.error('[POST /api/checkout-sessions] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        // @review - Non users can pay invoices
        // const { userId } = getAuth(request)
        // if (!userId)
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id)
            return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
        await connectToDatabase()
        const session = await (await CheckoutSessionModel.findById(id))?.populate('invoiceId')
        if (!session)
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        return NextResponse.json(session, { status: 200 })
    } catch (error: any) {
        console.error('[GET /api/checkout-sessions] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
