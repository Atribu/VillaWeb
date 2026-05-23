import { NextResponse } from "next/server";
import type { DemoExternalServiceStatus } from "@/lib/demo-external-links";
import {
  DemoExternalLinksStoreError,
  updateDemoExternalServiceStatus,
} from "@/lib/server/demo-external-links-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoExternalServiceStatus>(["ACTIVE", "WARNING", "OFFLINE"]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status?: DemoExternalServiceStatus;
    };

    if (!payload.status || !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoExternalLinksStoreError("Gecerli bir servis durumu secilmelidir.");
    }

    const service = await updateDemoExternalServiceStatus(id, payload.status);
    return NextResponse.json({ service });
  } catch (error) {
    if (error instanceof DemoExternalLinksStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Dis servis guncellenirken hata olustu." }, { status: 500 });
  }
}
