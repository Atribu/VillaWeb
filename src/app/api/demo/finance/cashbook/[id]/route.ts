import { NextResponse } from "next/server";
import {
  deleteManualCashEntry,
  DemoFinanceStoreError,
} from "@/lib/server/demo-finance-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteManualCashEntry(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof DemoFinanceStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Kasa kaydi silinirken hata olustu." },
      { status: 500 },
    );
  }
}
