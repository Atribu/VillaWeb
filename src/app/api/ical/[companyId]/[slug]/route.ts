import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildCalendar } from "@/lib/ical-calendar";
import { shiftDateKey } from "@/lib/booking-dates";
import { getFallbackVillas } from "@/lib/server/development-fallback-data";
import {
  isDevelopmentFallbackForced,
  isPrismaConnectionError,
} from "@/lib/server/development-fallback";
import { verifyVillaIcalToken } from "@/lib/server/villa-ical";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    companyId: string;
    slug: string;
  }>;
};


async function getFallbackCalendarVilla(companyId: string, slug: string) {
  const villa = (await getFallbackVillas(companyId)).find((item) => item.slug === slug);

  if (!villa) {
    return null;
  }

  return {
    title: villa.title,
    events: villa.availabilityRanges.map((range) => ({
      id: range.id,
      startDate: range.startDate,
      endDate: range.endDate,
      summary: range.status === "RESERVED" ? "Dolu" : "Kapali",
    })),
  };
}

export async function GET(request: Request, context: RouteContext) {
  const { companyId, slug } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";

  if (!verifyVillaIcalToken(companyId, slug, token)) {
    return NextResponse.json({ error: "Gecersiz takvim baglantisi." }, { status: 403 });
  }

  let villa: Awaited<ReturnType<typeof getFallbackCalendarVilla>>;

  if (isDevelopmentFallbackForced()) {
    villa = await getFallbackCalendarVilla(companyId, slug);
  } else {
    try {
      const record = await db.villa.findFirst({
        where: { companyId, slug },
        select: {
          title: true,
          availabilityBlocks: {
            orderBy: { startsAt: "asc" },
            select: {
              id: true,
              startsAt: true,
              endsAt: true,
              blockType: true,
              updatedAt: true,
            },
          },
        },
      });

      villa = record
        ? {
            title: record.title,
            events: record.availabilityBlocks.map((range) => ({
              id: range.id,
              startDate: range.startsAt.toISOString().slice(0, 10),
              endDate: range.endsAt.getUTCHours() === 23 ? shiftDateKey(range.endsAt.toISOString().slice(0, 10), 1) : range.endsAt.toISOString().slice(0, 10),
              summary: range.blockType === "RESERVED" ? "Dolu" : "Kapali",
              updatedAt: range.updatedAt,
            })),
          }
        : null;
    } catch (error) {
      if (!isPrismaConnectionError(error)) {
        console.error("Villa iCal export failed", error);
        return NextResponse.json({ error: "Takvim olusturulamadi." }, { status: 500 });
      }

      villa = await getFallbackCalendarVilla(companyId, slug);
    }
  }

  if (!villa) {
    return NextResponse.json({ error: "Villa bulunamadi." }, { status: 404 });
  }

  const calendar = buildCalendar({ companyId, title: villa.title, events: villa.events });

  return new NextResponse(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="villa-uygunluk.ics"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
