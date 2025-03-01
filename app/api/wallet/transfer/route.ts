import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'

import { UserModel } from '@/models/User.model'
import { getWalletFromUser } from '@/lib/coinbase'
import { Coinbase } from '@coinbase/coinbase-sdk'
import connectToDatabase from '@/lib/database'
import { supportedAssets } from '@/config'

export async function POST(request: NextRequest) {
    try {
        const { userId } = getAuth(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { asset, recipient, amount } = body
        if (!asset || !recipient || !amount)
            return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
        if (!supportedAssets.includes(asset))
            return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 })

        await connectToDatabase()
        const user = await UserModel.findOne({ userId })
        if (!user || !user.wallet?.id)
            return NextResponse.json({ error: 'User Not Found' }, { status: 404 })
        const destinationUser = await UserModel.findOne({ email: recipient })

        const wallet = await getWalletFromUser(user)

        const balance = await wallet.getBalance(asset)
        if (balance.lessThan(amount))
            return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

        const transfer = await (
            await wallet.createTransfer({
                amount,
                assetId: asset,
                destination: destinationUser?.wallet?.address || recipient,
                gasless: asset === Coinbase.assets.Usdc,
            })
        ).wait({ timeoutSeconds: 60 })

        return NextResponse.json({
            transactionLink: transfer.getTransactionLink(),
            status: transfer.getStatus(),
        })
    } catch (error: any) {
        console.error('[wallet/transfers POST] Transfer Failed:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const { userId } = getAuth(request)
        if (!userId)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectToDatabase()
        const user = await UserModel.findOne({ userId })
        if (!user || !user.wallet?.id)
            return NextResponse.json({ error: 'User Not Found' }, { status: 404 })

        const wallet = await getWalletFromUser(user)
        const address = await wallet.getDefaultAddress()

        // Parse limit & page from query string: ?limit=10&page=xxxxx
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '10', 10)
        const page = (searchParams.get('page')) || undefined

        const pageResponse = await address.listTransfers({ limit, page })

        const _transfers = pageResponse.data
        const hasMore = pageResponse.hasMore
        const nextPage = pageResponse.nextPage

        const transfers = []
        const addressUserMap = new Map()

        for await (const transfer of _transfers) {
            const destinationAddress = transfer.getDestinationAddressId()
            let destinationUser
            if (addressUserMap.has(destinationAddress)) {
                destinationUser = addressUserMap.get(destinationAddress)
            } else {
                destinationUser = await UserModel.findOne({
                    'wallet.address': { $regex: new RegExp(destinationAddress, 'i') },
                })
                addressUserMap.set(destinationAddress, destinationUser)
            }

            transfers.push({
                id: transfer.getId(),
                destinationAddress,
                destinationUser: destinationUser || null,
                assetId: transfer.getAssetId(),
                amount: transfer.getAmount().toNumber(),
                transactionLink: transfer.getTransactionLink(),
                status: transfer.getStatus(),
            })
        }

        transfers.reverse()

        return NextResponse.json(
            {
                transfers,
                hasMore,
                nextPage,
            },
            { status: 200 }
        )
    } catch (error: any) {
        console.error('[wallet/transfers GET] Failed to list transfers:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
