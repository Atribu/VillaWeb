import { NextResponse } from "next/server";
import {
  createDemoIcalSource,
  DemoCalendarSyncStoreError,
} from "@/lib/server/demo-calendar-sync-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      villaId?: string;
      channelName?: string;
      sourceUrl?: string;
      direction?: "IMPORT" | "EXPORT";
    };

    if (payload.direction !== "IMPORT" && payload.direction !== "EXPORT") {
      throw new DemoCalendarSyncStoreError("Gecerli bir takvim yonu secilmelidir.");
    }

    const source = await createDemoIcalSource({
      villaId: String(payload.villaId ?? ""),
      channelName: String(payload.channelName ?? ""),
      sourceUrl: String(payload.sourceUrl ?? ""),
      direction: payload.direction,
    });

    return NextResponse.json({ source });
  } catch (error) {
    if (error instanceof DemoCalendarSyncStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "iCal kaynagi olusturulurken hata olustu." }, { status: 500 });
  }
}
