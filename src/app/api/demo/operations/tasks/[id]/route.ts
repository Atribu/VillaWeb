import { NextResponse } from "next/server";
import type { DemoOperationTaskStatus } from "@/lib/demo-operations-workflow";
import { DemoOperationsStoreError, updateDemoOperationTaskStatus } from "@/lib/server/demo-operations-store";
import { revalidateDemoExperience } from "@/lib/server/demo-revalidate";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoOperationTaskStatus>([
  "PENDING",
  "READY",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status?: DemoOperationTaskStatus;
    };

    if (!payload.status || !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoOperationsStoreError("Gecerli bir operasyon durumu secilmelidir.");
    }

    const task = await updateDemoOperationTaskStatus(id, payload.status);
    revalidateDemoExperience(task.villaSlug);

    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof DemoOperationsStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Operasyon gorevi guncellenirken hata olustu." },
      { status: 500 },
    );
  }
}
