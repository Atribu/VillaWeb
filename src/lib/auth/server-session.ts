import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, createSessionToken, readSessionToken } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/session";

export async function getUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return readSessionToken(token);
}

export async function setUserSession(user: SessionUser) {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();
  const payload = await readSessionToken(token);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: payload ? new Date(payload.expiresAt) : undefined,
  });
}

export async function clearUserSession() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}
