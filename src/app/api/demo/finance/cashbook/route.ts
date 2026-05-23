import { NextResponse } from "next/server";
import type { DemoCashDirection } from "@/lib/demo-finance";
import {
  createManualCashEntry,
  DemoFinanceStoreError,
} from "@/lib/server/demo-finance-store";

export const runtime = "nodejs";

const ALLOWED_DIRECTIONS = new Set<DemoCashDirection>(["INCOME", "EXPENSE"]);

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      direction?: DemoCashDirection;
      category?: string;
      title?: string;
      amount?: number;
      date?: string;
      note?: string;
    };

    if (!payload.direction || !ALLOWED_DIRECTIONS.has(payload.direction)) {
      throw new DemoFinanceStoreError("Gecerli bir kasa hareket tipi secilmelidir.");
    }

    const entry = await createManualCashEntry({
      direction: payload.direction,
      category: String(payload.category ?? ""),
      title: String(payload.title ?? ""),
      amount: Number(payload.amount ?? 0),
      date: String(payload.date ?? ""),
      note: String(payload.note ?? ""),
    });

    return NextResponse.json({ entry });
  } catch (error) {
    if (error instanceof DemoFinanceStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Kasa kaydi olusturulurken hata olustu." },
      { status: 500 },
    );
  }
}
