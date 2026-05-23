import { NextResponse } from "next/server";
import type { DemoPaymentStatus } from "@/lib/demo-finance";
import {
  DemoFinanceStoreError,
  updateDemoPaymentStatus,
} from "@/lib/server/demo-finance-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoPaymentStatus>(["PENDING", "PAID", "CANCELLED"]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status?: DemoPaymentStatus;
    };

    if (!payload.status || !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoFinanceStoreError("Gecerli bir odeme durumu secilmelidir.");
    }

    const payment = await updateDemoPaymentStatus(id, payload.status);

    return NextResponse.json({ payment });
  } catch (error) {
    if (error instanceof DemoFinanceStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Odeme durumu guncellenirken hata olustu." },
      { status: 500 },
    );
  }
}
