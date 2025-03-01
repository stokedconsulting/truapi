import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import connectToDatabase from '@/lib/database'
import { InvoiceModel } from '@/models/Invoice.model'
import { UserModel } from '@/models/User.model'
import { createWallet, listenToAddress } from '@/lib/coinbase'
import { Coinbase } from '@coinbase/coinbase-sdk'

export async function POST(request: NextRequest) {
    try {
        const { userId } = getAuth(request)
        if (!userId)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        await connectToDatabase()
        const user = await UserModel.findOne({ userId })
        if (!user)
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        const body = await request.json()
        const {
            name,
            email,
            dueDate,
            paymentCollection,
            invoiceItems,
        } = body
        if (!name || !email || !dueDate || !paymentCollection || !invoiceItems)
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

        if (paymentCollection === "one-time") {
            const { wallet, encryptedSeed } = await createWallet()
            const addr = await wallet.getDefaultAddress()
            body.wallet = { address: addr.getId(), seed: encryptedSeed }
            await listenToAddress(addr.getId())
        }

        const newInvoice = await InvoiceModel.create({
            userId: user._id,
            name,
            email,
            dueDate,
            paymentAsset: Coinbase.assets.Usdc,
            paymentCollection,
            invoiceItems,
            wallet: body.wallet
        })
        return NextResponse.json(newInvoice, { status: 201 })
    } catch (error: any) {
        console.error('[POST /api/invoices] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const { userId } = getAuth(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        await connectToDatabase()
        const user = await UserModel.findOne({ userId })
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        const invoices = await InvoiceModel.find({ userId: user._id }).sort({ createdAt: -1 })
        return NextResponse.json(invoices, { status: 200 })
    } catch (error: any) {
        console.error('[GET /api/invoices] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
