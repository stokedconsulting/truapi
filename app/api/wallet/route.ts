import { NextRequest, NextResponse } from 'next/server'
import { getAuth, clerkClient } from '@clerk/nextjs/server'
import { UserDocument, UserModel } from '@/models/User.model'
import * as coinbase from '@/lib/coinbase'
import connectToDatabase from '@/lib/database'

export async function GET(request: NextRequest) {
    try {
        const { userId } = getAuth(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectToDatabase();

        let user = await UserModel.findOne({ userId }) as UserDocument
        const _user = await (await clerkClient()).users.getUser(userId)

        if (!user) {
            const _name =
                (!_user.firstName && !_user.lastName)
                    ? _user.primaryEmailAddress?.emailAddress.split('@')[0]
                    : (_user.firstName || '') +
                    (_user.lastName ? ' ' + _user.lastName : '')

            user = new UserModel({
                userId: _user.id,
                name: _name,
                email: _user.primaryEmailAddress?.emailAddress,
                imageUrl: _user.imageUrl,
                wallet: { rewards: [] },
                faucet: {},
            })
            await user.save()
        }

        if (!user.wallet?.id) {
            try {
                user = await coinbase.createWalletForUser(user)
            } catch (err) {
                console.error(
                    `[controllers/wallet/getUser] Failed to create wallet | User: ${user?.userId}`
                )
                console.error(err)
            }
        }

        return NextResponse.json(user, { status: 200 })
    } catch (error: any) {
        console.error(`[controllers/wallet/getUser] Failed to get user`)
        console.error(error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
