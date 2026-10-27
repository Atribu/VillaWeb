import { authorizePanelApi, panelAccessErrorResponse } from "@/lib/auth/api-access";
import { NextResponse } from "next/server";
import type { DemoCalendarSourceStatus } from "@/lib/demo-calendar-sync";
import {
  DemoCalendarSyncStoreError,
  updateDemoIcalSource,
} from "@/lib/server/demo-calendar-sync-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoCalendarSourceStatus>(["HEALTHY", "WARNING", "ERROR"]);

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await authorizePanelApi(request, "calendar");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      active?: boolean;
      status?: DemoCalendarSourceStatus;
      sourceUrl?: string;
    };

    if (
      payload.status !== undefined &&
      !ALLOWED_STATUSES.has(payload.status)
    ) {
      throw new DemoCalendarSyncStoreError("Gecerli bir kaynak durumu secilmelidir.");
    }

    if (
      payload.active === undefined &&
      payload.status === undefined &&
      payload.sourceUrl === undefined
    ) {
      throw new DemoCalendarSyncStoreError("Guncellenecek en az bir alan secilmelidir.");
    }
    if ((payload.active !== undefined && typeof payload.active !== "boolean") ||
        (payload.sourceUrl !== undefined && typeof payload.sourceUrl !== "string")) {
      throw new DemoCalendarSyncStoreError("Kaynak ayarlari gecersiz.");
    }

    const source = await updateDemoIcalSource(id, payload);
    return NextResponse.json({ source });
  } catch (error) {
    const accessError = panelAccessErrorResponse(error);
    if (accessError) return accessError;
    if (error instanceof DemoCalendarSyncStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Kaynak guncellenirken hata olustu." }, { status: 500 });
  }
}
