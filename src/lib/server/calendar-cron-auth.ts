import "server-only";
import { timingSafeEqual } from "node:crypto";

export function authorizeCalendarCron(request: Request): "allowed" | "unconfigured" | "denied" {
  const secret = process.env.CALENDAR_SYNC_SECRET;
  if (!secret || secret.length < 32) return "unconfigured";
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return "denied";
  const supplied = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected) ? "allowed" : "denied";
}
