import { authorizePanelApi, panelAccessErrorResponse } from "@/lib/auth/api-access";
import { NextResponse } from "next/server";
import type { DemoCacheGroupStatus } from "@/lib/demo-settings";
import {
  DemoSettingsStoreError,
  updateDemoCacheGroup,
} from "@/lib/server/demo-settings-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoCacheGroupStatus>(["HEALTHY", "WARMING", "STALE"]);

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await authorizePanelApi(request, "settings");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status?: DemoCacheGroupStatus;
      ttlMinutes?: number;
      warmNow?: boolean;
    };

    if (payload.status !== undefined && !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoSettingsStoreError("Gecerli bir cache durumu secilmelidir.");
    }

    const cacheGroup = await updateDemoCacheGroup(id, payload);
    return NextResponse.json({ cacheGroup });
  } catch (error) {
    const accessError = panelAccessErrorResponse(error);
    if (accessError) return accessError;
    if (error instanceof DemoSettingsStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Cache ayari guncellenirken hata olustu." }, { status: 500 });
  }
}
