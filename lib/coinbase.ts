import { Coinbase, Wallet, Webhook } from "@coinbase/coinbase-sdk";
import { UserDocument } from "../models/User.model";
import { decryptString, encryptString } from "./encryption";
import { WebhookWalletActivityFilter } from "@coinbase/coinbase-sdk/dist/client";
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { importJWK, importPKCS8, SignJWT } from "jose";

const cb = Coinbase.configure({
    apiKeyName: process.env.CDP_API_KEY_NAME as string,
    privateKey: process.env.CDP_API_PRIVATE_KEY as string,
    useServerSigner: false
});

// ===============================
// Mongo Helper
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
// Wallet Helper
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

        const webhookUri = `${process.env.NEXT_PUBLIC_URL}/api/webhook`;

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

// ===============================
// Coinbase Request Helper
// ===============================

const createCoinbaseRequest = async (method: 'GET' | 'POST', path: string) => {
    const keyName = process.env.CDP_API_KEY_NAME as string;
    const keySecret = process.env.CDP_API_PRIVATE_KEY as string;
    const host = 'api.developer.coinbase.com';

    const url = `https://${host}${path}`;
    const uri = `${method} ${host}${path}`;

    const issuedAt = Math.floor(Date.now() / 1000);
    const payload = {
        iss: 'coinbase-cloud',
        nbf: issuedAt,
        exp: issuedAt + 120,
        sub: keyName,
        uri,
    };

    let alg: "ES256" | "EdDSA";
    let signingKey: any;
    if (keySecret.startsWith("-----BEGIN")) {
        // Convert the SEC1 PEM key to a PKCS#8 formatted key.
        const pkcs8Key = crypto
            .createPrivateKey(keySecret)
            .export({ type: "pkcs8", format: "pem" }) as string;
        alg = "ES256";
        signingKey = await importPKCS8(pkcs8Key, alg);
    } else {
        // Assume Ed25519 key: a base64-encoded 64-byte string.
        const decoded = Buffer.from(keySecret, "base64");
        if (decoded.length !== 64) {
            throw new Error("Invalid Ed25519 key format");
        }
        const seed = decoded.subarray(0, 32);
        const publicKey = decoded.subarray(32);
        const jwk = {
            kty: "OKP",
            crv: "Ed25519",
            d: seed.toString("base64url"),
            x: publicKey.toString("base64url"),
        };
        alg = "EdDSA";
        signingKey = await importJWK(jwk, alg);
    }

    const jwtToken = await new SignJWT(payload)
        .setProtectedHeader({
            alg,
            kid: keyName,
            typ: "JWT",
            nonce: crypto.randomBytes(16).toString("hex"),
        })
        .setIssuedAt(issuedAt)
        .setNotBefore(issuedAt)
        .setExpirationTime(issuedAt + 120)
        .sign(signingKey);

    return { url, jwt: jwtToken };
};

type FetchOnrampRequestParams = {
    requestMethod: "GET" | "POST";
    url: string;
    jwt: string;
    body?: string;
};

interface JsonResponse {
    message?: string;
    [key: string]: any; // This allows for additional properties in the response
}

async function fetchCoinbaseRequest({
    requestMethod,
    url,
    jwt,
    body,
}: FetchOnrampRequestParams) {
    return await fetch(url, {
        method: requestMethod,
        body: body,
        headers: { Authorization: "Bearer " + jwt },
    })
        .then((response) => response.json() as JsonResponse)
        .catch((error) => {
            throw error;
        });
}

export {
    cb,
    createWalletForUser,
    getWalletFromUser,
    createWallet,
    getWalletFromData,
    listenToAddress,
    unlistenToAddress,
    createCoinbaseRequest,
    fetchCoinbaseRequest
};