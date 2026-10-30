import { NextResponse } from "next/server";
import { authorizePanelApi } from "@/lib/auth/api-access";
import { updateVillaGallery } from "@/lib/server/panel-villa-tools";
import { panelRecordErrorResponse } from "@/lib/server/panel-record-response";
import { revalidateDemoExperience } from "@/lib/server/demo-revalidate";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizePanelApi(request, "villas");
  if (denied) return denied;
  try {
    const gallery = await updateVillaGallery((await params).id, await request.json());
    revalidateDemoExperience(gallery.slug);
    return NextResponse.json({ gallery });
  } catch (error) { return panelRecordErrorResponse(error); }
}
