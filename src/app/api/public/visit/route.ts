import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import { getDemoVillaBySlug } from "@/lib/server/demo-villa-store";
import { recordVisit } from "@/lib/server/conversion-report";
import { trafficSource } from "@/lib/platform-features";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const origin = request.headers.get("origin"); const host = request.headers.get("host") ?? new URL(request.url).host;
  try {
    if (!origin || new URL(origin).host !== host || request.headers.get("sec-fetch-site") === "cross-site") return new NextResponse(null, { status: 403 });
  } catch { return new NextResponse(null, { status: 403 }); }
  if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1" || /bot|crawler|spider/i.test(request.headers.get("user-agent") ?? "")) return new NextResponse(null, { status: 204 });
  try {
    const input = await request.json(); if (typeof input.villaSlug !== "string" || input.villaSlug.length > 200) return new NextResponse(null, { status: 400 });
    const company = await getCurrentPublicCompany();
    const villa = await getDemoVillaBySlug(input.villaSlug, { publicSite: true, includeInactive: false, includeMetrics: false });
    if (!villa) return new NextResponse(null, { status: 404 });
    const saved = (await cookies()).get("villa_visit")?.value;
    const id = saved && /^[a-f0-9-]{36}$/.test(saved) ? saved : randomUUID();
    await recordVisit(company.id, villa.id, id, trafficSource(input.source) === "PANEL" ? "DIRECT" : trafficSource(input.source));
    const response = new NextResponse(null, { status: 204 }); response.headers.set("Cache-Control", "no-store");
    response.cookies.set("villa_visit", id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 86400 }); return response;
  } catch { return new NextResponse(null, { status: 400 }); }
}
