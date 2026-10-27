import { authorizePanelApi, panelAccessErrorResponse } from "@/lib/auth/api-access";
import { NextResponse } from "next/server";
import type { DemoLandingStatus } from "@/lib/demo-websites";
import {
  DemoWebsitesStoreError,
  updateDemoLandingPage,
} from "@/lib/server/demo-websites-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoLandingStatus>(["LIVE", "DRAFT", "REVISION"]);

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await authorizePanelApi(request, "websites");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status?: DemoLandingStatus;
    };

    if (!payload.status || !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoWebsitesStoreError("Gecerli bir landing durumu secilmelidir.");
    }

    const landing = await updateDemoLandingPage(id, { status: payload.status });
    return NextResponse.json({ landing });
  } catch (error) {
    const accessError = panelAccessErrorResponse(error);
    if (accessError) return accessError;
    if (error instanceof DemoWebsitesStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Landing sayfasi guncellenirken hata olustu." }, { status: 500 });
  }
}
