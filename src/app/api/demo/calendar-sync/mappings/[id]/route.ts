import { NextResponse } from "next/server";
import type { DemoSyncMode } from "@/lib/demo-calendar-sync";
import {
  DemoCalendarSyncStoreError,
  updateDemoChannelMapping,
} from "@/lib/server/demo-calendar-sync-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_MODES = new Set<DemoSyncMode>(["IMPORT_ONLY", "TWO_WAY"]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      active?: boolean;
      syncMode?: DemoSyncMode;
      remoteCalendarName?: string;
    };

    if (
      payload.syncMode !== undefined &&
      !ALLOWED_MODES.has(payload.syncMode)
    ) {
      throw new DemoCalendarSyncStoreError("Gecerli bir senkron modu secilmelidir.");
    }

    if (
      payload.active === undefined &&
      payload.syncMode === undefined &&
      payload.remoteCalendarName === undefined
    ) {
      throw new DemoCalendarSyncStoreError("Guncellenecek en az bir alan secilmelidir.");
    }

    const mapping = await updateDemoChannelMapping(id, payload);
    return NextResponse.json({ mapping });
  } catch (error) {
    if (error instanceof DemoCalendarSyncStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Eslestirme guncellenirken hata olustu." }, { status: 500 });
  }
}
