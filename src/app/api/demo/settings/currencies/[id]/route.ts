import { NextResponse } from "next/server";
import type { DemoCurrencyRateStatus } from "@/lib/demo-settings";
import {
  DemoSettingsStoreError,
  updateDemoCurrencyRate,
} from "@/lib/server/demo-settings-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoCurrencyRateStatus>(["LIVE", "MANUAL", "STALE"]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      buyRate?: number;
      sellRate?: number;
      status?: DemoCurrencyRateStatus;
    };

    if (payload.status !== undefined && !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoSettingsStoreError("Gecerli bir kur durumu secilmelidir.");
    }

    const currency = await updateDemoCurrencyRate(id, payload);
    return NextResponse.json({ currency });
  } catch (error) {
    if (error instanceof DemoSettingsStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Kur guncellenirken hata olustu." }, { status: 500 });
  }
}
