import { NextResponse } from "next/server";
import {
  createDemoDiscountCampaign,
  DemoOperationsStoreError,
} from "@/lib/server/demo-operations-store";
import { revalidateDemoExperience } from "@/lib/server/demo-revalidate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      title?: string;
      villaScope?: string;
      percentOff?: number;
      startDate?: string;
      endDate?: string;
      note?: string;
      active?: boolean;
    };

    const discount = await createDemoDiscountCampaign({
      title: String(payload.title ?? ""),
      villaScope:
        String(payload.villaScope ?? "").trim() === "" ? "ALL" : String(payload.villaScope),
      percentOff: Number(payload.percentOff ?? 0),
      startDate: String(payload.startDate ?? ""),
      endDate: String(payload.endDate ?? ""),
      note: String(payload.note ?? ""),
      active: payload.active !== false,
    });

    revalidateDemoExperience(discount.villaScope === "ALL" ? undefined : discount.villaScope);

    return NextResponse.json({ discount });
  } catch (error) {
    if (error instanceof DemoOperationsStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Indirim kampanyasi eklenirken hata olustu." },
      { status: 500 },
    );
  }
}
