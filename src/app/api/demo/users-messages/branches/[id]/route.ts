import { NextResponse } from "next/server";
import type { DemoBranchStatus } from "@/lib/demo-users-messages";
import {
  DemoUsersMessagesStoreError,
  updateDemoBranchStatus,
} from "@/lib/server/demo-users-messages-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoBranchStatus>(["ACTIVE", "PAUSED"]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status?: DemoBranchStatus;
    };

    if (!payload.status || !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoUsersMessagesStoreError("Gecerli bir sube durumu secilmelidir.");
    }

    const branch = await updateDemoBranchStatus(id, payload.status);

    return NextResponse.json({ branch });
  } catch (error) {
    if (error instanceof DemoUsersMessagesStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Sube guncellenirken hata olustu." }, { status: 500 });
  }
}
