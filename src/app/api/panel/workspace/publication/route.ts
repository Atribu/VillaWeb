import { NextResponse } from "next/server";
import { authorizePanelApi } from "@/lib/auth/api-access";
import { savePublicationPolicy } from "@/lib/server/publication-policy";
import { panelRecordErrorResponse } from "@/lib/server/panel-record-response";
import { revalidatePath } from "next/cache";
export async function POST(request: Request) {
  const denied = await authorizePanelApi(request, "settings");
  if (denied) return denied;
  try {
    const payload = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    const result = await savePublicationPolicy(String(payload.companyId ?? ''), payload.required, Number(payload.version));
    revalidatePath("/panel", "layout");
    revalidatePath("/villalar");
    return NextResponse.json({ result });
  } catch (error) { return panelRecordErrorResponse(error); }
}

