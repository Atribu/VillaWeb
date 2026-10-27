import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { registerSession, resolveSession, revokeSession } from "@/lib/auth/session-store";
import type { SessionUser } from "@/lib/auth/session";

export const getUserSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return resolveSession(token);
});

export async function setUserSession(user: SessionUser) {
  const { token, expiresAt } = await registerSession(user);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) await revokeSession(token);

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}
