import { authorizePanelApi, panelAccessErrorResponse } from "@/lib/auth/api-access";
import { NextResponse } from "next/server";
import {
  DemoCalendarSyncStoreError,
  runDemoCalendarSync,
} from "@/lib/server/demo-calendar-sync-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const denied = await authorizePanelApi(_request, "calendar");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const result = await runDemoCalendarSync(id);
    return NextResponse.json(result);
  } catch (error) {
    const accessError = panelAccessErrorResponse(error);
    if (accessError) return accessError;
    if (error instanceof DemoCalendarSyncStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Senkron baslatilirken hata olustu." }, { status: 500 });
  }
}
