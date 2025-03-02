import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import connectToDatabase from '@/lib/database'
import { InvoiceModel } from '@/models/Invoice.model'
import { UserModel } from '@/models/User.model'
import { createWallet, listenToAddress } from '@/lib/coinbase'
import { Coinbase } from '@coinbase/coinbase-sdk'
import mongoose from 'mongoose'

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
            isDraft
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
            wallet: body.wallet,
            status: !!isDraft ? 'draft' : undefined
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
        if (!user)
            return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const searchParams = request.nextUrl.searchParams;
        const invoiceId = searchParams.get('invoiceId');

        const query: { userId: mongoose.Types.ObjectId, _id?: mongoose.Types.ObjectId } = {
            userId: user._id as mongoose.Types.ObjectId,
        }
        if (invoiceId)
            query['_id'] = new mongoose.Types.ObjectId(invoiceId)

        const invoices = await InvoiceModel.find(query).sort({ createdAt: -1 }).populate('userId', 'name')
        return NextResponse.json(invoices, { status: 200 })
    } catch (error: any) {
        console.error('[GET /api/invoices] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { userId } = getAuth(request)
        if (!userId)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectToDatabase()

        const user = await UserModel.findOne({ userId })
        if (!user)
            return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const body = await request.json()
        const { invoiceId, name, email, dueDate, invoiceItems, isDraft } = body
        if (!invoiceId)
            return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })

        const invoice = await InvoiceModel.findOne({
            _id: new mongoose.Types.ObjectId(invoiceId),
            userId: user._id
        })

        if (!invoice)
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

        if (!!isDraft && invoice.status === 'draft') {
            invoice.name = name || invoice.name
            invoice.email = email || invoice.email
            invoice.dueDate = dueDate || invoice.dueDate
            if (invoiceItems) invoice.invoiceItems = invoiceItems
            invoice.status = 'draft'
            await invoice.save()
            return NextResponse.json(invoice, { status: 200 })
        }

        if (invoice.status !== 'draft') {
            invoice.status = 'void'
            await invoice.save()

            const newStatus = !!isDraft ? 'draft' : 'outstanding'
            const newInvoice = await InvoiceModel.create({
                userId: user._id,
                name: name || invoice.name,
                email: email || invoice.email,
                dueDate: dueDate || invoice.dueDate,
                paymentAsset: invoice.paymentAsset,
                paymentCollection: invoice.paymentCollection,
                invoiceItems: invoiceItems || invoice.invoiceItems,
                wallet: invoice.wallet,
                status: newStatus
            })
            return NextResponse.json(newInvoice, { status: 201 })
        }

        if (!isDraft && invoice.status === 'draft') {
            invoice.name = name || invoice.name
            invoice.email = email || invoice.email
            invoice.dueDate = dueDate || invoice.dueDate
            if (invoiceItems) invoice.invoiceItems = invoiceItems
            invoice.status = 'outstanding'
            await invoice.save()
            return NextResponse.json(invoice, { status: 200 })
        }

        return NextResponse.json(invoice, { status: 200 })
    } catch (error: any) {
        console.error('[PUT /api/invoices] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

