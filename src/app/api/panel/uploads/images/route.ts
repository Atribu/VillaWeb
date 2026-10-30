import { NextResponse } from "next/server";
import { authorizePanelApi } from "@/lib/auth/api-access";
import { convertImageToWebpBuffer, DemoVillaStoreError } from "@/lib/server/demo-villa-store";
import { stageConvertedImage } from "@/lib/server/staged-villa-images";
import { assertPanelCompanyAccess } from "@/lib/server/demo-company-context";
import { panelRecordErrorResponse } from "@/lib/server/panel-record-response";
import { recordSystemEvent } from "@/lib/server/system-health";
import { getCompanyRecordById } from "@/lib/server/company-store";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request) {
  const denied = await authorizePanelApi(request, "villas");
  if (denied) return denied;
  try {
    const form = await request.formData(); const companyId = String(form.get("companyId") ?? "");
    await assertPanelCompanyAccess(companyId);
    if (!companyId) return NextResponse.json({ error: "Firma seçilmedi." }, { status: 400 });
    if (!await getCompanyRecordById(companyId)) return NextResponse.json({ error: "Firma bulunamadı." }, { status: 404 });
    const file = form.get("image");
    if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Bir görsel seçin." }, { status: 400 });
    const buffer = await convertImageToWebpBuffer(file, "BookToVilla");
    return NextResponse.json(await stageConvertedImage(companyId, file.name, buffer));
  } catch (error) {
    await recordSystemEvent("IMAGE_UPLOAD_FAILED", error);
    if (error instanceof DemoVillaStoreError) return NextResponse.json({ error: error.message }, { status: 400 });
    return panelRecordErrorResponse(error);
  }
}
