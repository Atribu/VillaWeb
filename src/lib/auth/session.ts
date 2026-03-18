import type { AppRole } from "@/lib/auth/users";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const SESSION_COOKIE_NAME = "villaweb_session";

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  role: AppRole;
};

export type SessionPayload = SessionUser & {
  expiresAt: number;
};

function getSessionSecret() {
  return process.env.SESSION_SECRET ?? "villaweb-local-secret-change-me";
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
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const data = encodePayload(payload);
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));

  return `${data}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function readSessionToken(token: string) {
  const [data, signature] = token.split(".");

  if (!data || !signature) {
    return null;
  }

  const key = await getSigningKey();
  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(signature),
    encoder.encode(data),
  );

  if (!isValid) {
    return null;
  }

  const payload = decodePayload(data);

  if (!payload.expiresAt || payload.expiresAt < Date.now()) {
    return null;
  }

  return payload;
}
