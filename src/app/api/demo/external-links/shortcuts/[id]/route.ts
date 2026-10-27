import { authorizePanelApi, panelAccessErrorResponse } from "@/lib/auth/api-access";
import { NextResponse } from "next/server";
import type { DemoShortcutStatus } from "@/lib/demo-external-links";
import {
  DemoExternalLinksStoreError,
  updateDemoShortcutStatus,
} from "@/lib/server/demo-external-links-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoShortcutStatus>(["ACTIVE", "HIDDEN"]);

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await authorizePanelApi(request, "external-links");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status?: DemoShortcutStatus;
    };

    if (!payload.status || !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoExternalLinksStoreError("Gecerli bir kisayol durumu secilmelidir.");
    }

    const shortcut = await updateDemoShortcutStatus(id, payload.status);
    return NextResponse.json({ shortcut });
  } catch (error) {
    const accessError = panelAccessErrorResponse(error);
    if (accessError) return accessError;
    if (error instanceof DemoExternalLinksStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Kisayol guncellenirken hata olustu." }, { status: 500 });
  }
}
