// utils/encryptionKey.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const KEY_FILE_PATH = path.join(process.cwd(), 'my-secret.key');

const KEY_BYTE_LENGTH = 32;

let serverEncryptionKey: Buffer | null = null;

function loadOrGenerateKey(): Buffer {
    if (serverEncryptionKey) {
        return serverEncryptionKey;
    }

    if (fs.existsSync(KEY_FILE_PATH)) {
        serverEncryptionKey = fs.readFileSync(KEY_FILE_PATH);
    } else {
        serverEncryptionKey = crypto.randomBytes(KEY_BYTE_LENGTH);
        fs.writeFileSync(KEY_FILE_PATH, serverEncryptionKey);
    }

    return serverEncryptionKey;
}

export const getServerEncryptionKey = (): Buffer => {
    return loadOrGenerateKey();
};

export function encryptString(data: string): string {
    const key = getServerEncryptionKey();
    const iv = crypto.randomBytes(16); // 128-bit IV
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(data, "utf8", "base64");
    encrypted += cipher.final("base64");
    // store both the IV and ciphertext (use a delimiter or store as JSON)
    const payload = {
        iv: iv.toString("base64"),
        data: encrypted,
    };
    return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function decryptString(encryptedData: string): string {
    const key = getServerEncryptionKey();

    const payloadStr = Buffer.from(encryptedData, "base64").toString("utf8");
    const payload = JSON.parse(payloadStr);
    const iv = Buffer.from(payload.iv, "base64");
    const _encryptedData = Buffer.from(payload.data, "base64");

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(_encryptedData, undefined, "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
