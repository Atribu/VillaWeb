import { NextResponse } from "next/server";
import type { DemoAgencyStatus } from "@/lib/demo-users-messages";
import {
  DemoUsersMessagesStoreError,
  updateDemoAgencyStatus,
} from "@/lib/server/demo-users-messages-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoAgencyStatus>(["ACTIVE", "PAUSED"]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status?: DemoAgencyStatus;
    };

    if (!payload.status || !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoUsersMessagesStoreError("Gecerli bir acenta durumu secilmelidir.");
    }

    const agency = await updateDemoAgencyStatus(id, payload.status);

    return NextResponse.json({ agency });
  } catch (error) {
    if (error instanceof DemoUsersMessagesStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Acenta guncellenirken hata olustu." }, { status: 500 });
  }
}
