import * as coinbase from '@/lib/coinbase'
import connectToDatabase from '@/lib/database'
import "@/models"
import { UserDocument, UserModel } from '@/models/User.model'
import { clerkClient, getAuth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const { userId } = getAuth(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectToDatabase();

        const _user = await (await clerkClient()).users.getUser(userId)
        if (!_user.primaryEmailAddress?.emailAddress)
            return NextResponse.json({ error: 'User email not found' }, { status: 400 })

        let user = await UserModel.findOne({ email: _user.primaryEmailAddress.emailAddress }) as UserDocument

        if (!user) {
            const _name =
                (!_user.firstName && !_user.lastName)
                    ? _user.primaryEmailAddress.emailAddress.split('@')[0]
                    : (_user.firstName || '') +
                    (_user.lastName ? ' ' + _user.lastName : '')

            user = new UserModel({
                userId: _user.id,
                name: _name,
                email: _user.primaryEmailAddress.emailAddress,
                imageUrl: _user.imageUrl,
                wallet: { rewards: [] },
                faucet: {},
            })
            await user.save()
        }
        console.log(`clerkClient().users.getUser(${userId})`, user);
        if (!user.wallet?.id) {
            try {
                user = await coinbase.createWalletForUser(user)
            } catch (err) {
                console.error(
                    `[controllers/wallet/getUser] Failed to create wallet | User: ${user?.email}`
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
