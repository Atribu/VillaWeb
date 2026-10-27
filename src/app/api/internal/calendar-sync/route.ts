import { NextResponse } from "next/server";
import { authorizeCalendarCron } from "@/lib/server/calendar-cron-auth";
import { runDueCalendarSyncs } from "@/lib/server/calendar-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const authorization = authorizeCalendarCron(request);
  if (authorization !== "allowed") return NextResponse.json({ error: authorization === "unconfigured" ? "Senkron zamanlayicisi yapilandirilmadi." : "Yetkisiz istek." }, { status: authorization === "unconfigured" ? 503 : 401 });
  try {
    return NextResponse.json(await runDueCalendarSyncs(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Scheduled calendar sync failed before completing the batch");
    return NextResponse.json({ error: "Senkron toplu islemi tamamlanamadi." }, { status: 503 });
  }
}
