import { NextResponse } from "next/server";
import type { DemoDocumentLinkStatus } from "@/lib/demo-external-links";
import {
  DemoExternalLinksStoreError,
  updateDemoDocumentLinkStatus,
} from "@/lib/server/demo-external-links-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoDocumentLinkStatus>(["ACTIVE", "DRAFT", "ARCHIVED"]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status?: DemoDocumentLinkStatus;
    };

    if (!payload.status || !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoExternalLinksStoreError("Gecerli bir dokuman baglantisi durumu secilmelidir.");
    }

    const documentLink = await updateDemoDocumentLinkStatus(id, payload.status);
    return NextResponse.json({ documentLink });
  } catch (error) {
    if (error instanceof DemoExternalLinksStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Dokuman baglantisi guncellenirken hata olustu." }, { status: 500 });
  }
}
