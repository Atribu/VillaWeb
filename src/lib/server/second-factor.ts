import "server-only";
import { randomBytes } from "node:crypto";
import type { AuthSecondFactor } from "@prisma/client";
import { db } from "@/lib/db";
import { withDevelopmentFallback } from "@/lib/server/development-fallback";
import { mutatePlatformLocal, readPlatformLocal } from "@/lib/server/platform-local";
import { base32, sealSecret, openSecret, matchTotp, recoveryHash } from "@/lib/auth/totp";
import { getUserSession } from "@/lib/auth/server-session";
import { updateDevelopmentAuth } from "@/lib/auth/development-auth";
import { validateUser } from "@/lib/auth/users";
import { PanelAccessError } from "@/lib/auth/access-error";
import { PanelRecordError } from "@/lib/panel-record-tools";

function empty(userId: string): AuthSecondFactor { return { userId, secretCipher: null, pendingCipher: null, pendingExpiresAt: null, enabledAt: null,
  lastStep: -1, failedAttempts: 0, lockedUntil: null, recoveryHashes: [] }; }
async function changeFactor<T>(userId: string, update: (row: AuthSecondFactor) => T) {
  return withDevelopmentFallback(() => db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
    const row = await tx.authSecondFactor.findUnique({ where: { userId } }) ?? empty(userId); const result = update(row);
    await tx.authSecondFactor.upsert({ where: { userId }, create: row, update: row }); return result;
  }), () => mutatePlatformLocal<AuthSecondFactor, T>("second-factor", rows => {
    let row = rows.find(item => item.userId === userId); if (!row) { row = empty(userId); rows.push(row); }
    return update(row);
  }));
}
export async function factorEnabled(userId: string) {
  return withDevelopmentFallback(async () => Boolean((await db.authSecondFactor.findUnique({ where: { userId }, select: { enabledAt: true } }))?.enabledAt),
    async () => Boolean((await readPlatformLocal<AuthSecondFactor>("second-factor")).find(row => row.userId === userId)?.enabledAt));
}
function verify(row: AuthSecondFactor, code: string, pending = false) {
  if (row.lockedUntil && new Date(row.lockedUntil).getTime() > Date.now()) return false;
  const cipher = pending ? row.pendingCipher : row.secretCipher;
  let step: number | null = null;
  if (cipher) step = matchTotp(openSecret(cipher, row.userId), code.trim(), row.lastStep);
  const recovery = !pending && row.recoveryHashes.indexOf(recoveryHash(row.userId, code));
  if (step !== null || (typeof recovery === "number" && recovery >= 0)) {
    if (step !== null) row.lastStep = step;
    else row.recoveryHashes.splice(recovery as number, 1);
    row.failedAttempts = 0; row.lockedUntil = null; return true;
  }
  row.failedAttempts += 1;
  if (row.failedAttempts >= 5) { row.lockedUntil = new Date(Date.now() + 15 * 60000); row.failedAttempts = 0; }
  return false;
}
export async function verifyLoginFactor(userId: string, code: string) {
  return changeFactor(userId, row => Boolean(row.enabledAt) && verify(row, code));
}
export async function manageFactor(action: string, password: string, code = "") {
  const actor = await getUserSession();
  if (!actor || actor.role !== "SUPER_ADMIN") throw new PanelAccessError();
  const identity = await validateUser(actor.username, password, "");
  if (!identity.ok || identity.user.id !== actor.id) throw new PanelRecordError("Mevcut şifre doğrulanamadı.", 403);
  if (action === "begin") {
    const secret = base32(randomBytes(20)); const cipher = sealSecret(secret, actor.id);
    await changeFactor(actor.id, row => {
      if (row.enabledAt) throw new PanelRecordError("Doğrulama zaten etkin. Anahtarı değiştirmek için önce mevcut doğrulama ile kapatın.");
      row.pendingCipher = cipher; row.pendingExpiresAt = new Date(Date.now() + 10 * 60000);
    });
    return { secret, uri: `otpauth://totp/${encodeURIComponent(`BookToVilla:${actor.username}`)}?secret=${secret}&issuer=BookToVilla&algorithm=SHA1&digits=6&period=30` };
  }
  if (!["confirm", "disable", "recovery"].includes(action)) throw new PanelRecordError("Geçersiz doğrulama işlemi.");
  const codes = Array.from({ length: 8 }, () => randomBytes(12).toString("hex"));
  const success = await changeFactor(actor.id, row => {
    if (action === "confirm" && (row.enabledAt || !row.pendingExpiresAt || new Date(row.pendingExpiresAt).getTime() <= Date.now())) return false;
    if (action !== "confirm" && !row.enabledAt) return false;
    if (!verify(row, code, action === "confirm")) return false;
    if (action === "confirm") { row.secretCipher = row.pendingCipher; row.enabledAt = new Date(); row.pendingCipher = null; row.pendingExpiresAt = null; }
    row.recoveryHashes = action === "disable" ? [] : codes.map(value => recoveryHash(actor.id, value));
    if (action === "disable") { row.enabledAt = null; row.secretCipher = null; row.pendingCipher = null; row.lastStep = -1; }
    return true;
  });
  if (!success) throw new PanelRecordError("Kod geçersiz, kullanılmış veya süresi dolmuş. Beş hatalı denemeden sonra 15 dakika bekleyin.", 403);
  await withDevelopmentFallback(() => db.authSession.deleteMany({ where: { userId: actor.id } }).then(() => {}),
    () => updateDevelopmentAuth(data => { data.sessions = data.sessions.filter(session => session.userId !== actor.id); }));
  return { enabled: action !== "disable", recoveryCodes: action === "disable" ? [] : codes, signInAgain: true };
}
