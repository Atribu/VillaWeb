import { NextResponse } from "next/server";
import {
  DemoOperationsStoreError,
  upsertDemoPricingRecord,
} from "@/lib/server/demo-operations-store";
import { revalidateDemoExperience } from "@/lib/server/demo-revalidate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      villaSlug?: string;
      baseNightlyPrice?: number;
      cleaningFee?: number;
      minNightCount?: number;
    };
    const villaSlug = String(payload.villaSlug ?? "").trim();

    if (!villaSlug) {
      throw new DemoOperationsStoreError("Fiyat kaydi icin villa secimi zorunludur.");
    }

    const record = await upsertDemoPricingRecord({
      villaSlug,
      baseNightlyPrice: Number(payload.baseNightlyPrice ?? 0),
      cleaningFee: Number(payload.cleaningFee ?? 0),
      minNightCount: Number(payload.minNightCount ?? 1),
      updatedAt: new Date().toISOString(),
    });

    revalidateDemoExperience(villaSlug);

    return NextResponse.json({ pricing: record });
  } catch (error) {
    if (error instanceof DemoOperationsStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Fiyat kaydi guncellenirken hata olustu." },
      { status: 500 },
    );
  }
}
