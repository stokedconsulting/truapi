import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/database";
import { UserModel } from "@/models/User.model";
import { getWalletFromUser } from "@/lib/coinbase";
import { InvoiceModel } from "@/models/Invoice.model";
import { CheckoutSessionModel } from "@/models/CheckoutSession.model";
import { fetchTxTimestamp } from "@/lib/viem";

// Helper to format date keys
function formatKey(date: Date, timeFilter: string) {
    // 1D: "YYYY-MM-DD HH:00"
    if (timeFilter === "1d") {
        const iso = date.toISOString().split("T")[0]; // "YYYY-MM-DD"
        const hour = date.getHours();
        return `${iso} ${String(hour).padStart(2, "0")}:00`;
    }

    // 1W or 1M: "YYYY-MM-DD"
    if (timeFilter === "1w" || timeFilter === "1m") {
        return date.toISOString().split("T")[0].slice(5);
    }

    // 6M or 1Y: "YYYY-MM"
    if (timeFilter === "6m" || timeFilter === "1y") {
        const iso = date.toISOString().split("T")[0]; // "YYYY-MM-DD"
        return iso.slice(0, 7);
    }

    return date.toISOString().split("T")[0];
}

// Helper to generate a list of date keys from start to end
function generateAllKeys(timeFilter: string, start: Date, end: Date) {
    const keys: string[] = [];
    const temp = new Date(start);

    // For 1d => 24hrs
    if (timeFilter === "1d") {
        while (temp <= end) {
            const key = formatKey(temp, "1d");
            if (!keys.includes(key)) {
                keys.push(key);
            }
            temp.setHours(temp.getHours() + 1);
        }
        return keys;
    }

    // For 1w or 1m => daily
    if (timeFilter === "1w" || timeFilter === "1m") {
        while (temp <= end) {
            const key = formatKey(temp, timeFilter);
            if (!keys.includes(key)) {
                keys.push(key);
            }
            temp.setDate(temp.getDate() + 1);
        }
        return keys;
    }

    // For 6m or 1y => monthly
    if (timeFilter === "6m" || timeFilter === "1y") {
        temp.setDate(1);
        while (temp <= end) {
            const key = formatKey(temp, timeFilter);
            if (!keys.includes(key)) {
                keys.push(key);
            }
            temp.setMonth(temp.getMonth() + 1);
        }
        return keys;
    }

    return [];
}

export async function GET(request: NextRequest) {
    try {
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const user = await UserModel.findOne({ userId });
        if (!user || !user.wallet?.id) {
            return NextResponse.json({ error: "User Not Found" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const timeFilter = searchParams.get("timeFilter") || "1d";
        const now = new Date();
        let timeframeStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        switch (timeFilter) {
            case "1w":
                timeframeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "1m":
                timeframeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case "6m":
                timeframeStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
                break;
            case "1y":
                timeframeStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
        }

        const allKeys = generateAllKeys(timeFilter, timeframeStart, now);
        const volumeMap = new Map<string, number>();
        allKeys.forEach((k) => volumeMap.set(k, 0));

        let grossVolume = 0;
        let totalPayments = 0;

        // Wallet transfers
        const wallet = await getWalletFromUser(user);
        const address = await wallet.getDefaultAddress();
        const allTransfers = [];
        let nextPage: string | undefined;
        do {
            const pageResp = await address.listTransfers({ limit: 50, page: nextPage });
            allTransfers.push(...pageResp.data);
            if (!pageResp.hasMore) break;
            nextPage = pageResp.nextPage;
        } while (true);
        for (const transfer of allTransfers) {
            const txHash = transfer.getTransactionHash();
            let createdDate: Date | null = null;

            const tx = transfer.getTransaction();
            if (tx && (tx as any).timestamp) {
                createdDate = new Date((tx as any).timestamp * 1000);
            } else if (txHash) {
                createdDate = await fetchTxTimestamp(txHash);
            }
            if (!createdDate) {
                createdDate = new Date();
            }

            if (createdDate >= timeframeStart) {
                const amt = transfer.getAmount().toNumber();
                grossVolume += amt;
                totalPayments++;

                const key = formatKey(createdDate, timeFilter);
                const oldVal = volumeMap.get(key);
                if (typeof oldVal === "number") {
                    volumeMap.set(key, oldVal + amt);
                } else {
                    volumeMap.set(key, amt);
                }
            }
        }

        // Invoice payments
        const invoices = await InvoiceModel.find({ userId: user._id });
        for (const inv of invoices) {
            for (const pay of inv.payments) {
                const paidDate = new Date(pay.paidAt);
                if (paidDate >= timeframeStart) {
                    const amt = pay.amount;
                    grossVolume += amt;
                    totalPayments++;

                    const key = formatKey(paidDate, timeFilter);
                    const oldVal = volumeMap.get(key);
                    if (typeof oldVal === "number") {
                        volumeMap.set(key, oldVal + amt);
                    } else {
                        volumeMap.set(key, amt);
                    }
                }
            }
        }

        // Checkout payments
        const sessions = await CheckoutSessionModel.find({
            invoiceId: { $in: invoices.map((i) => i._id) }
        });
        for (const ses of sessions) {
            if (ses.payment?.amount) {
                const paidDate = new Date(ses.payment.paidAt);
                if (paidDate >= timeframeStart) {
                    const amt = ses.payment.amount;
                    grossVolume += amt;
                    totalPayments++;

                    const key = formatKey(paidDate, timeFilter);
                    const oldVal = volumeMap.get(key);
                    if (typeof oldVal === "number") {
                        volumeMap.set(key, oldVal + amt);
                    } else {
                        volumeMap.set(key, amt);
                    }
                }
            }
        }

        const volumeArray = Array.from(volumeMap.entries()).map(([name, volume]) => ({
            name,
            volume
        }));

        if (timeFilter === "1d") {
            volumeArray.sort((a, b) => {
                const adate = new Date(a.name.replace(" ", "T"));
                const bdate = new Date(b.name.replace(" ", "T"));
                return adate.getTime() - bdate.getTime();
            });
        } else if (timeFilter === "1w" || timeFilter === "1m") {
            volumeArray.sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
        } else {
            volumeArray.sort((a, b) => {
                const [ayear, amonth] = a.name.split("-");
                const [byear, bmonth] = b.name.split("-");
                const adate = new Date(Number(ayear), Number(amonth) - 1, 1);
                const bdate = new Date(Number(byear), Number(bmonth) - 1, 1);
                return adate.getTime() - bdate.getTime();
            });
        }

        return NextResponse.json(
            {
                volume: volumeArray,
                grossVolume,
                totalPayments
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("[dashboard GET] Failed to list volume:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
