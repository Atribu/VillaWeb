import { NextResponse } from "next/server";
import type { DemoPaymentMethodStatus } from "@/lib/demo-settings";
import {
  createDemoPaymentMethod,
  DemoSettingsStoreError,
} from "@/lib/server/demo-settings-store";

export const runtime = "nodejs";

const ALLOWED_STATUSES = new Set<DemoPaymentMethodStatus>(["ACTIVE", "PASSIVE"]);

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      label?: string;
      provider?: string;
      feePercent?: number;
      settlementDays?: number;
      status?: DemoPaymentMethodStatus;
      supportsInstallment?: boolean;
      note?: string;
    };

    if (!payload.status || !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoSettingsStoreError("Gecerli bir odeme durumu secilmelidir.");
    }

    const method = await createDemoPaymentMethod({
      label: String(payload.label ?? ""),
      provider: String(payload.provider ?? ""),
      feePercent: Number(payload.feePercent ?? 0),
      settlementDays: Number(payload.settlementDays ?? 0),
      status: payload.status,
      supportsInstallment: Boolean(payload.supportsInstallment),
      note: String(payload.note ?? ""),
    });

    return NextResponse.json({ method });
  } catch (error) {
    if (error instanceof DemoSettingsStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Odeme yontemi olusturulurken hata olustu." }, { status: 500 });
  }
}
