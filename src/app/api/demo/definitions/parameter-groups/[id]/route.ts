import { NextResponse } from "next/server";
import type { DemoDefinitionStatus } from "@/lib/demo-definitions";
import {
  DemoDefinitionsStoreError,
  updateDemoParameterGroupStatus,
} from "@/lib/server/demo-definitions-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoDefinitionStatus>(["ACTIVE", "DRAFT", "PASSIVE"]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status?: DemoDefinitionStatus;
    };

    if (!payload.status || !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoDefinitionsStoreError("Gecerli bir parametre grubu durumu secilmelidir.");
    }

    const group = await updateDemoParameterGroupStatus(id, payload.status);
    return NextResponse.json({ group });
  } catch (error) {
    if (error instanceof DemoDefinitionsStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Parametre grubu guncellenirken hata olustu." }, { status: 500 });
  }
}
