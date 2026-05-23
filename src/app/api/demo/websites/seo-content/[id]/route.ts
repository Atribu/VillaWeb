import { NextResponse } from "next/server";
import type { DemoSeoContentStatus } from "@/lib/demo-websites";
import {
  DemoWebsitesStoreError,
  updateDemoSeoContent,
} from "@/lib/server/demo-websites-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoSeoContentStatus>([
  "PLANNED",
  "IN_PROGRESS",
  "PUBLISHED",
]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status?: DemoSeoContentStatus;
      seoScore?: number;
    };

    if (payload.status !== undefined && !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoWebsitesStoreError("Gecerli bir SEO icerik durumu secilmelidir.");
    }

    const content = await updateDemoSeoContent(id, payload);
    return NextResponse.json({ content });
  } catch (error) {
    if (error instanceof DemoWebsitesStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "SEO icerigi guncellenirken hata olustu." }, { status: 500 });
  }
}
