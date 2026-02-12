import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

export function encrypt(key: string) {
    const encryption_key = process.env.ENCRYPTION_KEY;
    if (!encryption_key) {
        throw new Error("Encryption key is not set in environment variables.");
    }
    if (encryption_key.length !== 32) {
        throw new Error("ENCRYPTION_KEY must be 32 characters long.");
    }

    const iv = crypto.randomBytes(12); // GCM standard IV length
    const cipher = crypto.createCipheriv(ALGORITHM, encryption_key, iv);

    let encrypted = cipher.update(key, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    // We return all three parts needed to decrypt later
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a client-provided encrypted blob using the server's master secret.
 * @param encryptedBlob String format: "iv:authTag:encryptedData"
 * @throws Error if the blob is malformed or authentication fails
 */
type EncryptedBlob = string;
export function decrypt(encryptedBlob: EncryptedBlob): string {
    const parts: string[] = encryptedBlob.split(":");

    if (parts.length !== 3) {
        throw new Error("Invalid encrypted blob format. Expected 3 segments.");
    }

    const [ivHex, authTagHex, encryptedTextHex] = parts;

    // Convert hex strings to Buffers
    const iv: Buffer = Buffer.from(ivHex, "hex");
    const authTag: Buffer = Buffer.from(authTagHex, "hex");
    const encryptedText: Buffer = Buffer.from(encryptedTextHex, "hex");
    const MASTER_KEY: Buffer = Buffer.from(
        process.env.ENCRYPTION_KEY || "",
        "utf8"
    );
    // Create decipher
    // Note: GCM requires setAuthTag to be called before final()
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        MASTER_KEY,
        iv
    ) as crypto.DecipherGCM;

    decipher.setAuthTag(authTag);

    try {
        let decrypted: string = decipher.update(
            encryptedTextHex,
            "hex",
            "utf8"
        );
        decrypted += decipher.final("utf8");
        return decrypted;
    } catch (error) {
        // This will trigger if the authTag doesn't match (tampered data)
        throw new Error(
            "Decryption failed: Key is invalid or data has been tampered with."
        );
    }
}
