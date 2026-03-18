import { NextResponse } from "next/server";
import { getDemoVillaBySlug } from "@/lib/server/demo-villa-store";
import {
  DemoOperationsStoreError,
  validateDemoCoupon,
} from "@/lib/server/demo-operations-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      code?: string;
      villaSlug?: string;
      checkIn?: string;
      checkOut?: string;
    };
    const villaSlug = String(payload.villaSlug ?? "").trim();
    const code = String(payload.code ?? "").trim();
    const checkIn = String(payload.checkIn ?? "").trim();
    const checkOut = String(payload.checkOut ?? "").trim();

    if (!villaSlug || !checkIn || !checkOut) {
      throw new DemoOperationsStoreError("Kupon dogrulamasi icin villa ve tarih secimi gereklidir.");
    }

    if (!code) {
      throw new DemoOperationsStoreError("Lutfen bir kupon kodu gir.");
    }

    const villa = await getDemoVillaBySlug(villaSlug);

    if (!villa) {
      throw new DemoOperationsStoreError("Kupon icin secilen villa bulunamadi.");
    }

    const resolved = await validateDemoCoupon({
      code,
      villa,
      checkIn,
      checkOut,
    });

    return NextResponse.json({
      pricing: resolved.pricing,
      coupon: resolved.coupon,
    });
  } catch (error) {
    if (error instanceof DemoOperationsStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Kupon dogrulanirken beklenmeyen bir hata olustu." },
      { status: 500 },
    );
  }
}
