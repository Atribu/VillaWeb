import { createHmac, timingSafeEqual, randomBytes, createCipheriv, createDecipheriv, createHash } from "node:crypto";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function base32(bytes: Buffer) {
  let bits = 0, value = 0, result = "";
  for (const byte of bytes) { value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { result += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits) result += alphabet[(value << (5 - bits)) & 31]; return result;
}
function decode(value: string) {
  let bits = 0, accumulator = 0; const bytes: number[] = [];
  if (!/^[A-Z2-7]+$/.test(value)) throw new Error("Invalid TOTP secret.");
  for (const char of value) { accumulator = (accumulator << 5) | alphabet.indexOf(char); bits += 5;
    if (bits >= 8) { bytes.push((accumulator >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(bytes);
}
export function totp(secret: string, step: number, digits = 6) {
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac("sha1", decode(secret)).update(counter).digest(); const offset = digest[digest.length - 1] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % (10 ** digits)).padStart(digits, "0");
}
export function matchTotp(secret: string, code: string, lastStep: number, now = Date.now()) {
  if (!/^\d{6}$/.test(code)) return null;
  const current = Math.floor(now / 30000);
  for (const step of [current, current - 1, current + 1]) {
    if (step > lastStep && timingSafeEqual(Buffer.from(totp(secret, step)), Buffer.from(code))) return step;
  }
  return null;
}
function encryptionKey() {
  const key = process.env.MFA_ENCRYPTION_KEY?.trim() || (process.env.NODE_ENV !== "production" ? createHash("sha256").update(process.env.SESSION_SECRET || "local-mfa-development-only").digest("hex") : "");
  if (!/^[a-fA-F0-9]{64}$/.test(key)) throw new Error("MFA_ENCRYPTION_KEY must be a separate 32-byte hex key.");
  return Buffer.from(key, "hex");
}
export function sealSecret(secret: string, userId: string) {
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(`villaweb-mfa:${userId}`));
  const body = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map(b => b.toString("base64url")).join(".");
}
export function openSecret(value: string, userId: string) {
  const [iv, tag, body] = value.split(".").map(part => Buffer.from(part, "base64url"));
  const cipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv); cipher.setAAD(Buffer.from(`villaweb-mfa:${userId}`)); cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(body), cipher.final()]).toString("utf8");
}
export function recoveryHash(userId: string, code: string) { return createHash("sha256").update(`${userId}:${code.trim().toLowerCase()}`).digest("hex"); }
