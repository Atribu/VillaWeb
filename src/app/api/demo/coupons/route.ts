import { NextResponse } from "next/server";
import { createDemoCoupon, DemoOperationsStoreError } from "@/lib/server/demo-operations-store";
import { revalidateDemoExperience } from "@/lib/server/demo-revalidate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      title?: string;
      code?: string;
      villaScope?: string;
      percentOff?: number;
      startDate?: string;
      endDate?: string;
      usageLimit?: number;
      active?: boolean;
    };

    const coupon = await createDemoCoupon({
      title: String(payload.title ?? ""),
      code: String(payload.code ?? ""),
      villaScope:
        String(payload.villaScope ?? "").trim() === "" ? "ALL" : String(payload.villaScope),
      percentOff: Number(payload.percentOff ?? 0),
      startDate: String(payload.startDate ?? ""),
      endDate: String(payload.endDate ?? ""),
      usageLimit: Number(payload.usageLimit ?? 0),
      active: payload.active !== false,
    });

    revalidateDemoExperience(coupon.villaScope === "ALL" ? undefined : coupon.villaScope);

    return NextResponse.json({ coupon });
  } catch (error) {
    if (error instanceof DemoOperationsStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Kupon kaydi eklenirken hata olustu." },
      { status: 500 },
    );
  }
}
