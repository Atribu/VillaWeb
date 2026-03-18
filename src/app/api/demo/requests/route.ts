import { NextResponse } from "next/server";
import { findBlockedRange, getNightCount } from "@/lib/villa-availability";
import { getDemoVillaBySlug } from "@/lib/server/demo-villa-store";
import {
  createDemoRequest,
  DemoOperationsStoreError,
} from "@/lib/server/demo-operations-store";
import { revalidateDemoExperience } from "@/lib/server/demo-revalidate";

export const runtime = "nodejs";

type RequestPayload = {
  villaSlug?: string;
  checkIn?: string;
  checkOut?: string;
  guestCount?: number;
  fullName?: string;
  phone?: string;
  email?: string;
  message?: string;
  couponCode?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RequestPayload;
    const villaSlug = String(payload.villaSlug ?? "").trim();
    const checkIn = String(payload.checkIn ?? "").trim();
    const checkOut = String(payload.checkOut ?? "").trim();
    const guestCount = Number(payload.guestCount ?? 0);
    const fullName = String(payload.fullName ?? "").trim();
    const phone = String(payload.phone ?? "").trim();
    const email = String(payload.email ?? "").trim();
    const message = String(payload.message ?? "").trim();
    const couponCode = String(payload.couponCode ?? "").trim();

    if (!villaSlug || !checkIn || !checkOut) {
      throw new DemoOperationsStoreError("Villa ve tarih secimi olmadan talep kaydi acilamaz.");
    }

    if (!fullName || !phone || !email) {
      throw new DemoOperationsStoreError("Ad soyad, telefon ve e-posta alanlari zorunludur.");
    }

    if (!email.includes("@")) {
      throw new DemoOperationsStoreError("Gecerli bir e-posta adresi girilmelidir.");
    }

    if (!Number.isFinite(guestCount) || guestCount <= 0) {
      throw new DemoOperationsStoreError("Misafir sayisi en az 1 olmalidir.");
    }

    const villa = await getDemoVillaBySlug(villaSlug);

    if (!villa) {
      throw new DemoOperationsStoreError("Talep icin secilen villa bulunamadi.");
    }

    if (guestCount > villa.capacity) {
      throw new DemoOperationsStoreError(
        `Bu villa en fazla ${villa.capacity} misafir icin talep kabul ediyor.`,
      );
    }

    const nightCount = getNightCount(checkIn, checkOut);

    if (nightCount <= 0) {
      throw new DemoOperationsStoreError("Cikis tarihi giris tarihinden sonra olmalidir.");
    }

    if (nightCount < (villa.minNightCount ?? 1)) {
      throw new DemoOperationsStoreError(
        `Bu villa icin minimum ${villa.minNightCount ?? 1} gece secilmelidir.`,
      );
    }

    const blockedRange = findBlockedRange(checkIn, checkOut, villa.availabilityRanges);

    if (blockedRange) {
      throw new DemoOperationsStoreError(
        `${blockedRange.startDate} - ${blockedRange.endDate} araliginda villa uygun degil.`,
      );
    }

    const createdRequest = await createDemoRequest({
      villa,
      checkIn,
      checkOut,
      guestCount,
      fullName,
      phone,
      email,
      message,
      couponCode,
    });

    revalidateDemoExperience(villa.slug);

    return NextResponse.json({ request: createdRequest });
  } catch (error) {
    if (error instanceof DemoOperationsStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Talep kaydi sirasinda beklenmeyen bir hata olustu." },
      { status: 500 },
    );
  }
}
