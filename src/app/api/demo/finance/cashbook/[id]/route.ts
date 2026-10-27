import { authorizePanelApi, panelAccessErrorResponse } from "@/lib/auth/api-access";
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
  const denied = await authorizePanelApi(_request, "finance");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await deleteManualCashEntry(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const accessError = panelAccessErrorResponse(error);
    if (accessError) return accessError;
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
