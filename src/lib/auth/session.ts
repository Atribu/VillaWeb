import { isAppRole, type AppRole } from "@/lib/auth/permissions";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const SESSION_COOKIE_NAME = "villaweb_session";

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  role: AppRole;
  companyId?: string;
  companySlug?: string;
  companyName?: string;
};

export type SessionPayload = SessionUser & {
  expiresAt: number;
  sessionId: string;
};

function getSessionSecret() {
  const configured = process.env.SESSION_SECRET?.trim();
  if (configured && (process.env.NODE_ENV !== "production" || configured.length >= 32)) return configured;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return "villaweb-local-secret-change-me";
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function encodePayload(payload: SessionPayload) {
  return toBase64Url(encoder.encode(JSON.stringify(payload)));
}

function decodePayload(value: string) {
  const json = decoder.decode(fromBase64Url(value));
  return JSON.parse(json) as SessionPayload;
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(user: SessionUser) {
  const payload: SessionPayload = {
    ...user,
    sessionId: crypto.randomUUID(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const data = encodePayload(payload);
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));

  return `${data}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function readSessionToken(token: string) {
  if (token.length > 4096) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) return null;
  const [data, signature] = parts;

  if (!data || !signature) {
    return null;
  }

  const key = await getSigningKey();
  try {
    const isValid = await crypto.subtle.verify("HMAC", key, fromBase64Url(signature), encoder.encode(data));
    if (!isValid) return null;
    const payload = decodePayload(data);
    if (!payload || !Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now()
      || typeof payload.id !== "string" || !payload.id
      || typeof payload.username !== "string" || typeof payload.displayName !== "string"
      || typeof payload.sessionId !== "string" || !payload.sessionId
      || !isAppRole(payload.role)
      || (payload.role !== "SUPER_ADMIN" && (typeof payload.companyId !== "string" || !payload.companyId))) return null;
    return payload;
  } catch {
    return null;
  }
}
