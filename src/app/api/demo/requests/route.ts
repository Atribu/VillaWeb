import { NextResponse } from "next/server";
import { REQUEST_STATUS_OPTIONS, type RequestStatus } from "@/lib/demo-operations";
import { findBlockedRange, getNightCount } from "@/lib/villa-availability";
import { getDemoVillaBySlug } from "@/lib/server/demo-villa-store";
import {
  createDemoRequest,
  DemoOperationsStoreError,
} from "@/lib/server/demo-operations-store";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import { transitionDemoRequestStatus } from "@/lib/server/demo-request-lifecycle";
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
  initialStatus?: RequestStatus;
  origin?: "PUBLIC_FORM" | "MANUAL_PANEL";
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
    const initialStatus = payload.initialStatus ?? "NEW";
    const origin = payload.origin ?? "PUBLIC_FORM";
    const company = origin === "MANUAL_PANEL" ? null : await getCurrentPublicCompany();

    if (!REQUEST_STATUS_OPTIONS.some((option) => option.value === initialStatus)) {
      throw new DemoOperationsStoreError("Gecersiz rezervasyon durumu secildi.");
    }

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

    const villa = await getDemoVillaBySlug(
      villaSlug,
      company ? { companyId: company.id } : undefined,
    );

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
      origin,
      actorLabel: origin === "MANUAL_PANEL" ? "Panel kullanicisi" : "Public form",
    });

    const requestRecord =
      initialStatus === "NEW"
        ? createdRequest
        : await transitionDemoRequestStatus({
            requestId: createdRequest.id,
            status: initialStatus,
            villaSlug: createdRequest.villaSlug,
          });

    revalidateDemoExperience(villa.slug);

    return NextResponse.json({ request: requestRecord });
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
