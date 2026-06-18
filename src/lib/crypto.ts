import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Reversible encryption for sensitive at-rest data (a starter's platform
 * sign-in details). AES-256-GCM with a 32-byte key from CREDENTIALS_KEY (hex).
 * The key lives only in the server environment — never in the database or the
 * browser — so a database leak alone cannot reveal the secrets.
 */
const ALGO = "aes-256-gcm";

function getKey(): Buffer | null {
  const hex = process.env.CREDENTIALS_KEY ?? "";
  if (hex.length !== 64) return null; // 32 bytes hex
  return Buffer.from(hex, "hex");
}

export const isVaultConfigured = () => getKey() !== null;

/** Returns "iv.tag.ciphertext" (base64 parts) or null if not configured. */
export function encryptSecret(plaintext: string): string | null {
  const key = getKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

export function decryptSecret(blob: string | null): string {
  const key = getKey();
  if (!key || !blob) return "";
  try {
    const [ivB64, tagB64, dataB64] = blob.split(".");
    const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return "";
  }
}
