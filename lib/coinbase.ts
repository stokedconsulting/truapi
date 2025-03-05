import { Coinbase, Wallet, Webhook } from "@coinbase/coinbase-sdk";
import { UserDocument } from "../models/User.model";
import { decryptString, encryptString } from "./encryption";
import { tokenAddresses } from "@/config";
import { WebhookWalletActivityFilter } from "@coinbase/coinbase-sdk/dist/client";

const cb = Coinbase.configureFromJson({ filePath: 'cdp_api_key.json', useServerSigner: false });

// ===============================
// Mongo Helper functions
// ===============================
const createWalletForUser = async (user: UserDocument) => {
    const { wallet, encryptedSeed } = await createWallet();

    if (user.wallet) {
        user.wallet.id = wallet.getId();
        user.wallet.address = (await wallet.getDefaultAddress()).getId();
        user.wallet.seed = encryptedSeed;
    }

    await user.save();
    return user;
};

const getWalletFromUser = async (user: UserDocument) => {
    if (!user?.wallet?.address || !user.wallet.id || !user.wallet.seed) {
        throw new Error("User does not have an encrypted wallet set up.");
    }

    return getWalletFromData(user.wallet.id, user.wallet.seed);
}

// ===============================
// Helper functions
// ===============================
const createWallet = async () => {
    const wallet = await Wallet.create({
        networkId:
            process.env.NEXT_APP_ENV === "production"
                ? Coinbase.networks.BaseMainnet
                : Coinbase.networks.BaseSepolia,
        timeoutSeconds: 120,
    });
    const walletData = wallet.export();
    const encryptedSeed = encryptString(walletData.seed);

    return { wallet, encryptedSeed };
};

const getWalletFromData = async (walletId: string, encryptedSeed: string) => {
    const seed = decryptString(encryptedSeed);

    const wallet = await Wallet.import(
        {
            walletId,
            seed,
        },
        process.env.NEXT_APP_ENV === "production"
            ? Coinbase.networks.BaseMainnet
            : Coinbase.networks.BaseSepolia
    );

    return wallet;
}

// ===============================
// Webhook Helper
// ===============================
const listenToAddress = async (address: string) => {
    try {
        const networkId =
            process.env.NEXT_APP_ENV === "production"
                ? Coinbase.networks.BaseMainnet
                : Coinbase.networks.BaseSepolia;

        const webhookUri = process.env.NEXT_APP_ENV === "production"
            ? "https://superpayapp.xyz/api/webhook"
            : "https://8f64-2401-4900-1c97-474c-2854-b9ae-8191-c60e.ngrok-free.app/api/webhook";

        const resp = await Webhook.list();
        const webhooks = resp.data;
        let targetWebhook = webhooks.find((w) => {
            return (
                w.getNetworkId() === networkId &&
                w.getEventType() === "wallet_activity"
            );
        });

        const newFilter = {
            addresses: [address],
            wallet_id: address
        };

        if (!targetWebhook) {
            targetWebhook = await Webhook.create({
                networkId,
                notificationUri: webhookUri,
                eventType: "wallet_activity",
                eventTypeFilter: newFilter,
            });
        } else {
            const oldFilters = targetWebhook.getEventTypeFilter() as WebhookWalletActivityFilter;

            if (
                oldFilters &&
                !oldFilters.addresses?.some((f) => f.toLowerCase() === address.toLowerCase())
            ) {
                const updatedFilters = {
                    addresses: [...(oldFilters.addresses as string[]), address],
                    wallet_id: address
                };
                await targetWebhook.update({
                    notificationUri: targetWebhook.getNotificationURI(),
                    eventTypeFilter: updatedFilters,
                });
            }
        }
    } catch (err) {
        console.error("Failed to listenToAddress:", err);
    }
}

const unlistenToAddress = async (address: string) => {
    try {
        const networkId =
            process.env.NEXT_APP_ENV === "production"
                ? Coinbase.networks.BaseMainnet
                : Coinbase.networks.BaseSepolia;

        const resp = await Webhook.list();
        const webhooks = resp.data;

        const targetWebhook = webhooks.find((w) => {
            return (
                w.getNetworkId() === networkId &&
                w.getEventType() === "wallet_activity"
            );
        });

        if (!targetWebhook) {
            return;
        }

        const oldFilters = targetWebhook.getEventTypeFilter() as WebhookWalletActivityFilter;
        const newAddresses = oldFilters?.addresses?.filter((_address) => _address?.toLowerCase() != address.toLowerCase());
        const newFilters = {
            addresses: newAddresses,
            wallet_id: oldFilters.addresses ? oldFilters.addresses[0] : ""
        }

        if (oldFilters.addresses?.length === newFilters.addresses?.length)
            return;

        if (newFilters.addresses?.length === 0) {
            await targetWebhook.delete();
            return;
        }

        await targetWebhook.update({
            notificationUri: targetWebhook.getNotificationURI(),
            eventTypeFilter: newFilters,
        });
    } catch (err) {
        console.error("Failed to unlistenToAddress:", err);
    }
}

export { cb, createWalletForUser, getWalletFromUser, createWallet, getWalletFromData, listenToAddress, unlistenToAddress };