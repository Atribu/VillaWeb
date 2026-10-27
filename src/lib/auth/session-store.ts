import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { membershipAppRole } from "@/lib/auth/permissions";
import { createSessionToken, readSessionToken, type SessionUser } from "@/lib/auth/session";
import { getDevelopmentIdentity, readDevelopmentAuth, updateDevelopmentAuth } from "@/lib/auth/development-auth";
import { withDevelopmentFallback } from "@/lib/server/development-fallback";

function tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }

export async function registerSession(user: SessionUser) {
  const token = await createSessionToken(user);
  const payload = await readSessionToken(token);
  if (!payload) throw new Error("Invalid session identity.");
  await withDevelopmentFallback(
    () => db.authSession.create({ data: { userId: user.id, token: tokenHash(token), expiresAt: new Date(payload.expiresAt) } }).then(() => undefined),
    () => updateDevelopmentAuth((data) => { data.sessions.push({ userId: user.id, token: tokenHash(token), companyId: user.companyId, expiresAt: payload.expiresAt }); }),
  );
  return { token, expiresAt: payload.expiresAt };
}

export async function revokeSession(token: string) {
  const hash = tokenHash(token);
  await withDevelopmentFallback(
    () => db.authSession.deleteMany({ where: { token: hash } }).then(() => undefined),
    () => updateDevelopmentAuth((data) => { data.sessions = data.sessions.filter((session) => session.token !== hash); }),
  );
}

export async function resolveSession(token: string) {
  const payload = await readSessionToken(token);
  if (!payload) return null;
  const hash = tokenHash(token);
  const identity = await withDevelopmentFallback<SessionUser | null>(async () => {
    const stored = await db.authSession.findUnique({ where: { token: hash }, include: { user: { include: { memberships: { include: { company: true } } } } } });
    if (!stored || stored.userId !== payload.id || stored.expiresAt.getTime() <= Date.now() || !stored.user.isActive) return null;
    const user = stored.user;
    if (user.platformRole === "PLATFORM_OWNER") return { id: user.id, username: user.username, displayName: user.name, role: "SUPER_ADMIN" };
    const membership = user.memberships.find((item) => item.companyId === payload.companyId);
    if (!membership || membership.status !== "ACTIVE" || membership.company.status !== "ACTIVE") return null;
    const role = membershipAppRole(membership.role);
    if (!role) return null;
    return { id: user.id, username: user.username, displayName: user.name, role,
      companyId: membership.companyId, companySlug: membership.company.slug, companyName: membership.company.publicName };
  }, async () => {
    const stored = (await readDevelopmentAuth()).sessions.find((session) => session.token === hash);
    if (!stored || stored.userId !== payload.id || stored.expiresAt <= Date.now()) return null;
    return getDevelopmentIdentity(stored.userId);
  });
  // A role/company change must require a fresh login, not silently preserve old privileges.
  if (!identity || identity.role !== payload.role || identity.companyId !== payload.companyId) {
    await revokeSession(token);
    return null;
  }
  return { ...payload, ...identity };
}
