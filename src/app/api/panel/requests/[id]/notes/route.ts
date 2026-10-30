import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { authorizePanelApi } from "@/lib/auth/api-access";
import { getDemoRequestById } from "@/lib/server/demo-operations-store";
import { assertPanelCompanyAccess } from "@/lib/server/demo-company-context";
import { writePanelAudit } from "@/lib/server/panel-audit";
import { PanelRecordError } from "@/lib/panel-record-tools";
import { panelRecordErrorResponse } from "@/lib/server/panel-record-response";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizePanelApi(request, "reservations");
  if (denied) return denied;
  try {
    const { id } = await params;
    const payload = await request.json();
    if (typeof payload?.note !== "string" || !payload.note.trim() || payload.note.length > 2000) throw new PanelRecordError("1-2000 karakter uzunluğunda bir not yazın.");
    const record = await getDemoRequestById(id);
    if (!record) throw new PanelRecordError("Talep bulunamadı.", 404);
    await assertPanelCompanyAccess(record.companyId);
    await writePanelAudit({ companyId: record.companyId, entityType: "REQUEST", entityId: id, action: "REQUEST_NOTE", summary: payload.note.trim() });
    revalidatePath(`/panel/talepler/${id}`);
    return NextResponse.json({ ok: true });
  } catch (error) { return panelRecordErrorResponse(error); }
}
