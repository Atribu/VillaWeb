import "server-only";
import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/server-session";
import { hasPermission, type PanelPermission } from "@/lib/auth/permissions";
import { PanelAccessError } from "@/lib/auth/access-error";

export function panelAccessErrorResponse(error: unknown) {
  return error instanceof PanelAccessError ? NextResponse.json({ error: error.message }, { status: 403 }) : null;
}

export async function authorizePanelApi(request: Request, permission: PanelPermission) {
  // SameSite cookies do not protect against requests from an untrusted sibling subdomain.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") ?? new URL(request.url).host;
  let sameOrigin = !origin;
  if (origin) {
    try { const url = new URL(origin); sameOrigin = ["http:", "https:"].includes(url.protocol) && url.host === host; } catch { sameOrigin = false; }
  }
  if (!sameOrigin || request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Bu kaynaktan islem yapilamaz." }, { status: 403 });
  }
  try {
    const session = await getUserSession();
    if (!session) return NextResponse.json({ error: "Oturum acmaniz gerekiyor." }, { status: 401 });
    if (!hasPermission(session.role, permission)) return NextResponse.json({ error: "Bu islem icin yetkiniz bulunmuyor." }, { status: 403 });
    return null;
  } catch (error) {
    console.error("Session verification unavailable", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "Oturum dogrulanamadi. Lutfen tekrar deneyin." }, { status: 503 });
  }
}
