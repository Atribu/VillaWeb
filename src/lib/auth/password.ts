import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string) {
  const salt = randomBytes(24).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(storedHash: string, password: string) {
  // Older panel-created accounts used a colon inside the salt.
  const [algorithm, ...parts] = storedHash.split(":");
  const hash = parts.pop();
  const salt = parts.join(":");
  if (algorithm !== "scrypt" || !salt || !hash || !/^[0-9a-f]{128}$/i.test(hash)) return false;
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, "hex"));
}
