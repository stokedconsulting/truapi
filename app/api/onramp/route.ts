import { NextRequest, NextResponse } from 'next/server'
import { getAuth, clerkClient } from '@clerk/nextjs/server'
import connectToDatabase from '@/lib/database'
import { UserModel } from '@/models/User.model'
import "@/models";
import { createCoinbaseRequest, fetchCoinbaseRequest } from '@/lib/coinbase'

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase()

        const { userId } = getAuth(request)
        if (!userId)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const _user = await (await clerkClient()).users.getUser(userId)
        if (!_user.primaryEmailAddress?.emailAddress)
            return NextResponse.json({ error: 'User email not found' }, { status: 400 })

        const user = await UserModel.findOne({ email: _user.primaryEmailAddress.emailAddress })
        if (!user || !user.wallet?.address)
            return NextResponse.json({ error: 'User or Wallet not found' }, { status: 404 })

        const requestMethod = "POST";

        const { url, jwt } = await createCoinbaseRequest(requestMethod, "/onramp/v1/token");

        const body = {
            addresses: [
                {
                    address: user.wallet.address,
                    blockchains: ["base"],
                },
            ],
            assets: ['USDC']
        };

        const coinbaseResponse = await fetchCoinbaseRequest({
            requestMethod,
            url,
            jwt,
            body: JSON.stringify(body),
        });

        const onrampBuyUrl = `https://pay.coinbase.com/buy/select-asset?sessionToken=${coinbaseResponse.token}`;

        return NextResponse.json({ onrampBuyUrl }, { status: 200 })
    } catch (error: any) {
        console.error('[GET /api/onramp] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
