import { NextResponse } from "next/server";
import type { DemoSyncMode } from "@/lib/demo-calendar-sync";
import {
  createDemoChannelMapping,
  DemoCalendarSyncStoreError,
} from "@/lib/server/demo-calendar-sync-store";

export const runtime = "nodejs";

const ALLOWED_MODES = new Set<DemoSyncMode>(["IMPORT_ONLY", "TWO_WAY"]);

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      villaId?: string;
      channelName?: string;
      remoteCalendarName?: string;
      syncMode?: DemoSyncMode;
    };

    if (!payload.syncMode || !ALLOWED_MODES.has(payload.syncMode)) {
      throw new DemoCalendarSyncStoreError("Gecerli bir senkron modu secilmelidir.");
    }

    const mapping = await createDemoChannelMapping({
      villaId: String(payload.villaId ?? ""),
      channelName: String(payload.channelName ?? ""),
      remoteCalendarName: String(payload.remoteCalendarName ?? ""),
      syncMode: payload.syncMode,
    });

    return NextResponse.json({ mapping });
  } catch (error) {
    if (error instanceof DemoCalendarSyncStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Kanal eslestirmesi olusturulurken hata olustu." }, { status: 500 });
  }
}
