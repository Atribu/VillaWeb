import { NextResponse } from "next/server";
import type { DemoMessageStatus } from "@/lib/demo-users-messages";
import {
  DemoUsersMessagesStoreError,
  updateDemoInternalMessageStatus,
} from "@/lib/server/demo-users-messages-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoMessageStatus>(["NEW", "READ", "RESOLVED", "ARCHIVED"]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status?: DemoMessageStatus;
    };

    if (!payload.status || !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoUsersMessagesStoreError("Gecerli bir mesaj durumu secilmelidir.");
    }

    const message = await updateDemoInternalMessageStatus(id, payload.status);

    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof DemoUsersMessagesStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Mesaj guncellenirken hata olustu." }, { status: 500 });
  }
}
