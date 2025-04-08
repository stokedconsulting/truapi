import { NextRequest, NextResponse } from 'next/server'
import { getAuth, clerkClient } from '@clerk/nextjs/server'
import { UserModel } from '@/models/User.model'
import connectToDatabase from '@/lib/database'
import { getWalletFromUser } from '@/lib/coinbase'
import { supportedAssets } from '@/config'
import "@/models";

export async function POST(request: NextRequest) {
    try {
        const { userId } = getAuth(request)
        if (!userId)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { amount, fromAsset, toAsset } = body
        if (!amount || !fromAsset || !toAsset)
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        if (fromAsset === toAsset)
            return NextResponse.json({ error: 'Cannot trade same asset' }, { status: 400 })
        if (!supportedAssets.includes(fromAsset) || !supportedAssets.includes(toAsset))
            return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 })

        await connectToDatabase()
        
        const _user = await (await clerkClient()).users.getUser(userId)
        if (!_user.primaryEmailAddress?.emailAddress)
            return NextResponse.json({ error: 'User email not found' }, { status: 400 })
        
        const user = await UserModel.findOne({ email: _user.primaryEmailAddress.emailAddress })
        if (!user || !user.wallet?.id)
            return NextResponse.json({ error: 'User or wallet not found' }, { status: 404 })

        const wallet = await getWalletFromUser(user)

        const balance = await wallet.getBalance(fromAsset)
        if (balance.lessThan(amount))
            return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

        const trade = await wallet.createTrade({
            amount,
            fromAssetId: fromAsset,
            toAssetId: toAsset,
        })

        await trade.wait({ timeoutSeconds: 120 });

        return NextResponse.json(
            {
                tradeId: trade.getId(),
                fromAssetId: trade.getFromAssetId(),
                toAssetId: trade.getToAssetId(),
                fromAmount: trade.getFromAmount().toNumber(),
                toAmount: trade.getToAmount().toNumber(),
                status: trade.getStatus(),
                transactionLink: trade.getTransaction().getTransactionLink(),
            },
            { status: 200 }
        )
    } catch (error: any) {
        console.error('[wallet/trade POST] Trade failed:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
