import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import connectToDatabase from '@/lib/database'
import { InvoiceDocument, InvoiceModel } from '@/models/Invoice.model'
import { UserModel } from '@/models/User.model'
import { createWallet, listenToAddress, unlistenToAddress } from '@/lib/coinbase'
import { Coinbase } from '@coinbase/coinbase-sdk'
import mongoose from 'mongoose'
import { sendEmail } from '@/lib/aws'
import { invoicePaymentEmail } from '@/config/emailTemplates'

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
        if (!name || !email || !paymentCollection || !invoiceItems)
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

        if (paymentCollection === "one-time") {
            const { wallet, encryptedSeed } = await createWallet()
            const addr = await wallet.getDefaultAddress()
            body.wallet = { id: wallet.getId(), address: addr.getId(), seed: encryptedSeed }
            if (!Boolean(JSON.parse(isDraft || 'false')))
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
            status: Boolean(JSON.parse(isDraft || 'false')) ? 'draft' : undefined
        })

        if (paymentCollection == "one-time")
            sendEmail(
                newInvoice.email,
                "New Invoice Received",
                invoicePaymentEmail(
                    newInvoice.id,
                    `${newInvoice.invoiceItems.reduce((sum, item) => sum + item.price, 0).toString()} ${newInvoice.paymentAsset.toUpperCase()}`,
                    request.headers.get('origin') + `/payment/${newInvoice.id}`,
                    newInvoice.dueDate?.toISOString() || ""
                )
            );

        return NextResponse.json(newInvoice, { status: 201 })
    } catch (error: any) {
        console.error('[POST /api/invoices] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// @note - Common route for getting all user invoices or single invoice
// @dev - Auth only applies when getting all user invoices
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const invoiceId = searchParams.get('invoiceId');
        await connectToDatabase()

        const { userId } = getAuth(request)
        if (!invoiceId && !userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // If invoiceId is provided, just fetch that invoice(s) without pagination or counts
        if (invoiceId) {
            const invoices = await InvoiceModel.find({ _id: invoiceId })
                .sort({ createdAt: -1 })
                .populate('userId', 'name')
            return NextResponse.json({ invoices }, { status: 200 })
        }

        // Otherwise, userId is guaranteed to exist, so fetch all invoices for that user with pagination & counts
        const user = await UserModel.findOne({ userId })
        if (!user)
            return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const query: { userId: mongoose.Types.ObjectId } = {
            userId: user._id as mongoose.Types.ObjectId,
        }

        // Pagination
        const limit = parseInt(searchParams.get('limit') || '10')
        const page = parseInt(searchParams.get('page') || '1')
        const skip = (page - 1) * limit

        // Fetch paginated invoices
        const invoices = await InvoiceModel.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .populate('userId', 'name')

        // Count all invoices for the user
        const totalCount = await InvoiceModel.countDocuments(query)

        return NextResponse.json({
            invoices,
            totalCount
        }, { status: 200 })
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
        const { invoiceId, name, email, dueDate, invoiceItems, isDraft, isVoid } = body
        if (!invoiceId)
            return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })

        const invoice = await InvoiceModel.findOne({
            _id: new mongoose.Types.ObjectId(invoiceId),
            userId: user._id
        })

        if (!invoice)
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

        // @todo - handle multi-use unlisten? Void all checkout sessions
        if (Boolean(JSON.parse(isVoid || 'false'))) {
            invoice.status = 'void'
            await invoice.save()
            if (invoice.paymentCollection === 'one-time' && invoice.wallet?.address)
                await unlistenToAddress(invoice.wallet?.address);
            return NextResponse.json(invoice, { status: 200 })
        }

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

            if (newInvoice.paymentCollection === "one-time" && invoice.wallet?.address)
                await listenToAddress(invoice.wallet?.address)

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

