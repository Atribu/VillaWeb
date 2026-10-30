import { NextResponse } from "next/server";
import { authorizePanelApi } from "@/lib/auth/api-access";
import { bulkUpdateVillaStatus } from "@/lib/server/panel-villa-tools";
import { panelRecordErrorResponse } from "@/lib/server/panel-record-response";
import { revalidateDemoExperience } from "@/lib/server/demo-revalidate";

export async function PATCH(request: Request) {
  const denied = await authorizePanelApi(request, "villas");
  if (denied) return denied;
  try {
    const slugs = await bulkUpdateVillaStatus(await request.json());
    for (const slug of slugs) revalidateDemoExperience(slug);
    return NextResponse.json({ count: slugs.length });
  } catch (error) { return panelRecordErrorResponse(error); }
}
