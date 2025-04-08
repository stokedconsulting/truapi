import { NextRequest, NextResponse } from 'next/server'
import { getAuth, clerkClient } from '@clerk/nextjs/server'

import connectToDatabase from '@/lib/database'
import { UserModel } from '@/models/User.model'
import { getWalletFromUser } from '@/lib/coinbase'
import { supportedAssets } from '@/config'
import { BatchTransferItem } from '@/types/api.types'
import "@/models";

export async function POST(request: NextRequest) {
    try {
        const { userId } = getAuth(request)
        if (!userId)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const body = await request.json()
        const { data } = body
        if (!Array.isArray(data) || data.length === 0)
            return NextResponse.json({ error: 'No batch data provided' }, { status: 400 })

        await connectToDatabase()

        const _user = await (await clerkClient()).users.getUser(userId)
        if (!_user.primaryEmailAddress?.emailAddress)
            return NextResponse.json({ error: 'User email not found' }, { status: 400 })

        const user = await UserModel.findOne({ email: _user.primaryEmailAddress.emailAddress })
        if (!user || !user.wallet?.id)
            return NextResponse.json({ error: 'User or wallet not found' }, { status: 404 })

        const wallet = await getWalletFromUser(user)

        const totalByAsset: Record<string, number> = {}
        for (const row of data as BatchTransferItem[]) {
            if (!totalByAsset[row.asset]) {
                totalByAsset[row.asset] = 0
            }
            totalByAsset[row.asset] = totalByAsset[row.asset] + Number(row.amount)
        }
        for (const [asset, totalAmount] of Object.entries(totalByAsset)) {
            if (!supportedAssets.includes(asset)) {
                return NextResponse.json({ error: `Unsupported asset: ${asset}` }, { status: 400 })
            }
            const balance = await wallet.getBalance(asset)
            // if (balance.lessThan(totalAmount)) {
            //     return NextResponse.json({ error: `Insufficient balance for ${asset}` }, { status: 400 })
            // }
        }

        const transferResults: Array<{
            status: 'success' | 'failed'
            reason?: string
            transactionLink?: string
            asset?: string
        }> = []

        for (const row of data as BatchTransferItem[]) {
            const { asset, destination, amount } = row

            if (!asset || !destination || !amount) {
                transferResults.push({
                    status: 'failed',
                    reason: 'Missing asset/destination/amount in row',
                })
                continue
            }

            if (!supportedAssets.includes(asset)) {
                transferResults.push({
                    status: 'failed',
                    reason: `Unsupported asset: ${asset}`,
                })
                continue
            }

            try {
                const transfer = await wallet.createTransfer({
                    amount: Number(amount),
                    assetId: asset,
                    destination,
                    gasless: asset === 'usdc',
                })

                await transfer.wait({ timeoutSeconds: 120 })

                transferResults.push({
                    status: 'success',
                    transactionLink: transfer.getTransactionLink(),
                    asset,
                })
            } catch (err: any) {
                console.error('[batch-transfer] Transfer error:', err)
                transferResults.push({
                    status: 'failed',
                    reason: err?.message || 'Unknown error',
                })
            }
        }

        return NextResponse.json({ transferStatus: transferResults }, { status: 200 })
    } catch (error: any) {
        console.error('[batch-transfer] Unexpected Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
