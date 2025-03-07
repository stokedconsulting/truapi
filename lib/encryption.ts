// utils/encryptionKey.ts
import crypto from 'crypto';

let serverEncryptionKey: Buffer | null = null;

function loadOrGenerateKey(): Buffer {
    if (serverEncryptionKey) return serverEncryptionKey;
  
    const keyString = process.env.SERVER_ENCRYPTION_KEY;
    if (!keyString) {
      throw new Error("Missing SERVER_ENCRYPTION_KEY in environment variables.");
    }
  
    serverEncryptionKey = Buffer.from(keyString, "base64");
  
    if (serverEncryptionKey.length !== 32) {
      throw new Error("ENCRYPTION_KEY must be exactly 32 bytes when decoded.");
    }
  
    return serverEncryptionKey;
}

const getServerEncryptionKey = (): Buffer => {
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
