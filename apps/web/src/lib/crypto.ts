import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from "node:crypto";

/**
 * Field-level encryption for connector tokens / sensitive identifiers.
 * AES-256-GCM keyed from KMS_ENCRYPTION_KEY_ID. This is a correct local
 * encrypt-at-rest implementation, but it is NOT a managed KMS (no rotation,
 * no HSM, key lives in env) — see QUESTIONS.md #9.
 */
function deriveKey(): Buffer {
  const secret = process.env.KMS_ENCRYPTION_KEY_ID || "dev-only-fallback-key";
  return scryptSync(secret, "pulse-field-encryption-salt", 32);
}

export function encryptSecret(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptSecret(payload: string): string {
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const key = deriveKey();
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/** Deterministic dedupe hash for ledger rows — fallback to when a provider transaction id is absent. */
export function dedupeHash(parts: Array<string | number | null | undefined>): string {
  const normalized = parts.map((p) => (p === null || p === undefined ? "" : String(p))).join("|");
  return createHash("sha256").update(normalized).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
