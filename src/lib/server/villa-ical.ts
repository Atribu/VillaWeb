import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

function getIcalSecret() {
  const secret = process.env.ICAL_SIGNING_SECRET ?? process.env.SESSION_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("ICAL_SIGNING_SECRET veya SESSION_SECRET production ortaminda zorunludur.");
  }

  return "villaweb-local-ical-secret-change-me";
}

export function createVillaIcalToken(companyId: string, slug: string) {
  return createHmac("sha256", getIcalSecret())
    .update(`${companyId}:${slug}`)
    .digest("base64url");
}

export function verifyVillaIcalToken(companyId: string, slug: string, token: string) {
  if (!token) {
    return false;
  }

  const expected = createVillaIcalToken(companyId, slug);
  const expectedBuffer = Buffer.from(expected);
  const tokenBuffer = Buffer.from(token);

  return expectedBuffer.length === tokenBuffer.length && timingSafeEqual(expectedBuffer, tokenBuffer);
}

export function getVillaIcalPath(companyId: string, slug: string) {
  const token = createVillaIcalToken(companyId, slug);
  return `/api/ical/${encodeURIComponent(companyId)}/${encodeURIComponent(slug)}?token=${encodeURIComponent(token)}`;
}
