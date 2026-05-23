import { NextResponse } from "next/server";
import {
  DemoSettingsStoreError,
  updateDemoSystemDefaults,
} from "@/lib/server/demo-settings-store";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as {
      leadResponseMinutes?: number;
      defaultMinNightCount?: number;
      defaultCleaningLeadHours?: number;
      supportPhone?: string;
      supportEmail?: string;
      defaultCurrency?: string;
      requestReminderHours?: number;
    };

    const defaults = await updateDemoSystemDefaults(payload);
    return NextResponse.json({ defaults });
  } catch (error) {
    if (error instanceof DemoSettingsStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Sistem varsayilanlari guncellenirken hata olustu." }, { status: 500 });
  }
}
