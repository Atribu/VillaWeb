import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { SessionUser } from "@/lib/auth/session";
import { isAppRole } from "@/lib/auth/permissions";
import { getFallbackCompanyRecords, getFallbackTeamUsers } from "@/lib/server/development-fallback-data";

export type DevelopmentIdentity = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  passwordHash: string;
  isOwner: boolean;
};
export type StoredSession = { token: string; userId: string; companyId?: string; expiresAt: number };
type AuthData = { users: DevelopmentIdentity[]; sessions: StoredSession[] };

function authPath() {
  if (process.env.NODE_ENV === "production") throw new Error("Development authentication is disabled in production.");
  return path.join(process.env.DEV_DATA_DIRECTORY || path.join(process.cwd(), "data"), "development-auth.json");
}

export async function readDevelopmentAuth(): Promise<AuthData> {
  try {
    return JSON.parse(await readFile(authPath(), "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { users: [], sessions: [] };
    throw error;
  }
}

let pending: Promise<unknown> = Promise.resolve();
export function updateDevelopmentAuth(update: (data: AuthData) => void) {
  const operation = pending.then(async () => {
    const data = await readDevelopmentAuth();
    update(data);
    data.sessions = data.sessions.filter((session) => session.expiresAt > Date.now());
    const target = authPath();
    await mkdir(path.dirname(target), { recursive: true });
    const temporary = `${target}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(data), { mode: 0o600 });
    await rename(temporary, target);
  });
  pending = operation.catch(() => undefined);
  return operation;
}

export async function registerDevelopmentIdentity(identity: DevelopmentIdentity) {
  await updateDevelopmentAuth((data) => {
    if (data.users.some((user) => user.id === identity.id)) throw new Error("Authentication identity already exists.");
    data.users.push(identity);
  });
}

export async function getDevelopmentIdentity(userId: string): Promise<SessionUser | null> {
  const stored = (await readDevelopmentAuth()).users.find((user) => user.id === userId);
  if (!stored) return null;
  if (stored.isOwner) return { id: stored.id, username: stored.username, displayName: stored.displayName, role: "SUPER_ADMIN" };
  const member = (await getFallbackTeamUsers()).find((user) => user.id === userId);
  if (!member || member.status !== "ACTIVE" || !isAppRole(member.roleId) || member.roleId === ("SUPER_ADMIN" as string)) return null;
  const company = (await getFallbackCompanyRecords()).find((item) => item.id === member.companyId);
  if (!company || company.status !== "ACTIVE") return null;
  return { id: stored.id, username: member.username, displayName: member.fullName, role: member.roleId,
    companyId: company.id, companySlug: company.slug, companyName: company.name };
}
