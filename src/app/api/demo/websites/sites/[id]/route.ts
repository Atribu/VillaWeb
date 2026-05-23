import { NextResponse } from "next/server";
import type { DemoWebsiteStatus } from "@/lib/demo-websites";
import {
  DemoWebsitesStoreError,
  updateDemoWebsite,
} from "@/lib/server/demo-websites-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoWebsiteStatus>(["LIVE", "STAGING", "PAUSED"]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status?: DemoWebsiteStatus;
      default?: boolean;
    };

    if (payload.status !== undefined && !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoWebsitesStoreError("Gecerli bir site durumu secilmelidir.");
    }

    const website = await updateDemoWebsite(id, payload);
    return NextResponse.json({ website });
  } catch (error) {
    if (error instanceof DemoWebsitesStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Site kaydi guncellenirken hata olustu." }, { status: 500 });
  }
}
