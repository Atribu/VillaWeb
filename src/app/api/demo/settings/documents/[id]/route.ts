import { NextResponse } from "next/server";
import type { DemoDocumentStatus } from "@/lib/demo-settings";
import {
  DemoSettingsStoreError,
  updateDemoDocumentStatus,
} from "@/lib/server/demo-settings-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoDocumentStatus>(["ACTIVE", "DRAFT", "ARCHIVED"]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status?: DemoDocumentStatus;
    };

    if (!payload.status || !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoSettingsStoreError("Gecerli bir dokuman durumu secilmelidir.");
    }

    const document = await updateDemoDocumentStatus(id, payload.status);
    return NextResponse.json({ document });
  } catch (error) {
    if (error instanceof DemoSettingsStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Dokuman guncellenirken hata olustu." }, { status: 500 });
  }
}
