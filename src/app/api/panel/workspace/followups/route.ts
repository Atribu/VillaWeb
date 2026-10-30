import { NextResponse } from "next/server";
import { authorizePanelApi } from "@/lib/auth/api-access";
import { saveFollowUp } from "@/lib/server/panel-workspace";
import { panelRecordErrorResponse } from "@/lib/server/panel-record-response";
import { revalidatePath } from "next/cache";
export async function POST(request: Request) {
  const denied = await authorizePanelApi(request, "reservations");
  if (denied) return denied;
  try {
    const payload = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    const result = await saveFollowUp(payload);
    revalidatePath("/panel", "layout");
    revalidatePath("/villalar");
    return NextResponse.json({ result });
  } catch (error) { return panelRecordErrorResponse(error); }
}

