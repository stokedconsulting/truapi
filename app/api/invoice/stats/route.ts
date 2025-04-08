import { NextRequest, NextResponse } from 'next/server'
import { getAuth, clerkClient } from '@clerk/nextjs/server'
import connectToDatabase from '@/lib/database'
import { InvoiceModel } from '@/models/Invoice.model'
import { UserModel } from '@/models/User.model'
import mongoose from 'mongoose'
import "@/models";

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase()

        const { userId } = getAuth(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const _user = await (await clerkClient()).users.getUser(userId)
        if (!_user.primaryEmailAddress?.emailAddress)
            return NextResponse.json({ error: 'User email not found' }, { status: 400 })
        
        const user = await UserModel.findOne({ email: _user.primaryEmailAddress.emailAddress })
        if (!user)
            return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const query: { userId: mongoose.Types.ObjectId } = {
            userId: user._id as mongoose.Types.ObjectId,
        }

        // Count all invoices for the user
        const totalCount = await InvoiceModel.countDocuments(query)

        // Count by status
        const draftCount = await InvoiceModel.countDocuments({ ...query, status: 'draft' })
        const overdueCount = await InvoiceModel.countDocuments({ ...query, status: 'overdue' })
        const outstandingCount = await InvoiceModel.countDocuments({ ...query, status: 'outstanding' })
        const paidCount = await InvoiceModel.countDocuments({ ...query, status: 'paid' })
        const partiallyPaidCount = await InvoiceModel.countDocuments({ ...query, status: 'partially paid' })

        return NextResponse.json({
            totalCount,
            draftCount,
            overdueCount,
            outstandingCount,
            paidCount,
            partiallyPaidCount
        }, { status: 200 })
    } catch (error: any) {
        console.error('[GET /api/invoices/stats] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
