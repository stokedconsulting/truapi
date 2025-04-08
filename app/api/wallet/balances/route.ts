import { NextRequest, NextResponse } from 'next/server'
import { getAuth, clerkClient } from '@clerk/nextjs/server'

import { UserModel } from '@/models/User.model'
import { getWalletFromUser } from '@/lib/coinbase'
import { Coinbase } from '@coinbase/coinbase-sdk'
import connectToDatabase from '@/lib/database'
import "@/models";

export async function GET(request: NextRequest) {
    try {
        const { userId } = getAuth(request)
        if (!userId)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectToDatabase()
        
        const _user = await (await clerkClient()).users.getUser(userId)
        if (!_user.primaryEmailAddress?.emailAddress)
            return NextResponse.json({ error: 'User email not found' }, { status: 400 })
        
        const user = await UserModel.findOne({ email: _user.primaryEmailAddress.emailAddress })
        if (!user || !user.wallet?.id)
            return NextResponse.json({ error: 'User Not Found' }, { status: 404 })

        const wallet = await getWalletFromUser(user)

        const usdc = (await wallet.getBalance(Coinbase.assets.Usdc)).toNumber()
        const eth = (await wallet.getBalance(Coinbase.assets.Eth)).toNumber()
        let cbeth = 0;
        let cbbtc = 0;
        if (process.env.NEXT_PUBLIC_APP_ENV === "production") {
            cbeth = (await wallet.getBalance("cbeth")).toNumber();
            cbbtc = (await wallet.getBalance("0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf")).toNumber();
        }

        return NextResponse.json({ usdc, eth, cbeth, cbbtc }, { status: 200 })
    } catch (error: any) {
        console.error('[wallet/balances GET] Failed to get balances:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
