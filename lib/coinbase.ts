import { Coinbase, Wallet, Webhook } from "@coinbase/coinbase-sdk";
import { UserDocument } from "../models/User.model";
import { decryptString, encryptString } from "./encryption";
import { tokenAddresses } from "@/config";

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

        const usdcAddress = tokenAddresses.USDC[networkId];

        const webhookUri = process.env.NEXT_APP_ENV === "production"
            ? "https://superpayapp.xyz/api/webhook"
            : "https://a6e4-2401-4900-1c96-5e73-6474-d1df-7dcb-a58f.ngrok-free.app/api/webhook";

        const resp = await Webhook.list();
        const webhooks = resp.data;
        let targetWebhook = webhooks.find((w) => {
            return (
                w.getNetworkId() === networkId &&
                w.getEventType() === "erc20_transfer" &&
                w.getEventFilters()?.some(
                    (f) => f.contract_address?.toLowerCase() === usdcAddress.toLowerCase()
                )
            );
        });

        const newFilter = {
            contract_address: usdcAddress,
            to_address: address,
        };

        if (!targetWebhook) {
            targetWebhook = await Webhook.create({
                networkId,
                notificationUri: webhookUri,
                eventType: "erc20_transfer",
                eventFilters: [newFilter],
            });
        } else {
            const oldFilters = targetWebhook.getEventFilters() || [];

            if (
                !oldFilters.some(
                    (f) =>
                        f.contract_address?.toLowerCase() === usdcAddress.toLowerCase() &&
                        f.to_address?.toLowerCase() === address.toLowerCase()
                )
            ) {
                const updatedFilters = [...oldFilters, newFilter];
                await targetWebhook.update({
                    notificationUri: targetWebhook.getNotificationURI(),
                    eventFilters: updatedFilters,
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

        const usdcAddress = tokenAddresses.USDC[networkId];

        const resp = await Webhook.list();
        const webhooks = resp.data;

        const targetWebhook = webhooks.find((w) => {
            return (
                w.getNetworkId() === networkId &&
                w.getEventType() === "erc20_transfer" &&
                w.getEventFilters()?.some(
                    (f) => f.contract_address?.toLowerCase() === usdcAddress.toLowerCase()
                )
            );
        });

        if (!targetWebhook) {
            return;
        }

        const oldFilters = targetWebhook.getEventFilters() || [];
        const newFilters = oldFilters.filter(
            (f) =>
                !(
                    f.contract_address?.toLowerCase() === usdcAddress.toLowerCase() &&
                    f.to_address?.toLowerCase() === address.toLowerCase()
                )
        );

        if (newFilters.length === oldFilters.length)
            return;

        if (newFilters.length === 0) {
            await targetWebhook.delete();
            return;
        }

        await targetWebhook.update({
            notificationUri: targetWebhook.getNotificationURI(),
            eventFilters: newFilters,
        });
    } catch (err) {
        console.error("Failed to unlistenToAddress:", err);
    }
}

export { cb, createWalletForUser, getWalletFromUser, createWallet, getWalletFromData, listenToAddress, unlistenToAddress };