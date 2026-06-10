import { NextResponse } from "next/server";
import type { DemoCompanyStatus } from "@/lib/demo-companies";
import {
  createDemoCompany,
  DemoCompanyStoreError,
} from "@/lib/server/company-store";

export const runtime = "nodejs";

const ALLOWED_STATUSES = new Set<DemoCompanyStatus>(["ACTIVE", "PAUSED", "ARCHIVED"]);

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      publicName?: string;
      legalName?: string;
      shortName?: string;
      panelName?: string;
      primaryEmail?: string;
      primaryPhone?: string;
      whatsappNumber?: string;
      primaryDomain?: string;
      address?: string;
      taxNumber?: string;
      status?: DemoCompanyStatus;
    };

    const status = payload.status ?? "ACTIVE";

    if (!ALLOWED_STATUSES.has(status)) {
      throw new DemoCompanyStoreError("Gecerli bir firma durumu secilmelidir.");
    }

    const company = await createDemoCompany({
      publicName: String(payload.publicName ?? ""),
      legalName: String(payload.legalName ?? ""),
      shortName: String(payload.shortName ?? ""),
      panelName: String(payload.panelName ?? ""),
      primaryEmail: String(payload.primaryEmail ?? ""),
      primaryPhone: String(payload.primaryPhone ?? ""),
      whatsappNumber: String(payload.whatsappNumber ?? ""),
      primaryDomain: String(payload.primaryDomain ?? ""),
      address: String(payload.address ?? ""),
      taxNumber: String(payload.taxNumber ?? ""),
      status,
    });

    return NextResponse.json({ company });
  } catch (error) {
    if (error instanceof DemoCompanyStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Firma olusturulurken hata olustu." }, { status: 500 });
  }
}
