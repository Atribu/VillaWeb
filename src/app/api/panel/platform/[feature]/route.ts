import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { authorizePanelApi } from "@/lib/auth/api-access";
import type { PanelPermission } from "@/lib/auth/permissions";
import { panelRecordErrorResponse } from "@/lib/server/panel-record-response";
import { PanelRecordError } from "@/lib/panel-record-tools";
import { requiredText } from "@/lib/panel-workspace";
import { assertPanelCompanyAccess } from "@/lib/server/demo-company-context";
import { saveCompanyPackage } from "@/lib/server/company-platform";
import { saveSiteDraft, publishSiteDraft } from "@/lib/server/site-publication";
import { manageFactor } from "@/lib/server/second-factor";
import { bulkPricing } from "@/lib/server/advanced-pricing";
import { offerPortfolio, respondPortfolio } from "@/lib/server/portfolio-sharing";
import { getDemoBranches, createDemoTeamUser } from "@/lib/server/demo-users-messages-store";

export const runtime = "nodejs";
const permissions: Record<string, PanelPermission> = { site: "websites", logo: "websites", package: "companies", security: "companies", "first-user": "users", pricing: "pricing", sharing: "sharing" };
export async function POST(request: Request, context: { params: Promise<{ feature: string }> }) {
  const denied = await authorizePanelApi(request, permissions[(await context.params).feature] ?? "companies"); if (denied) return denied;
  const { feature } = await context.params; const permission = permissions[feature];
  if (!permission) return NextResponse.json({ error: "İşlem bulunamadı." }, { status: 404 });
  try {
    if (feature === "logo") {
      const form = await request.formData(); const companyId = requiredText(form.get("companyId"), "Firma"); await assertPanelCompanyAccess(companyId);
      const file = form.get("logo"); if (!(file instanceof File) || !file.size || file.size > 10 * 1024 * 1024) throw new PanelRecordError("Logo için en fazla 10 MB resim seçin.");
      const input = Buffer.from(await file.arrayBuffer()); const metadata = await sharp(input, { limitInputPixels: 16000000 }).metadata();
      if (!["jpeg", "png", "webp"].includes(metadata.format ?? "")) throw new PanelRecordError("Logo JPG, PNG veya WebP olmalı.");
      const buffer = await sharp(input, { limitInputPixels: 16000000 }).rotate().resize({ width: 640, height: 240, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
      const folder = `brand-${createHash("sha256").update(companyId).digest("hex").slice(0, 20)}`; const fileName = `${randomUUID()}.webp`;
      const root = path.join(process.cwd(), "public", "uploads", "villas", folder); await mkdir(root, { recursive: true }); await writeFile(path.join(root, fileName), buffer);
      return NextResponse.json({ url: `/uploads/villas/${folder}/${fileName}` }, { headers: { "Cache-Control": "no-store" } });
    }
    const input = await request.json(); let result: unknown;
    if (feature === "security") {
      if (typeof input.password !== "string" || !input.password || input.password.length > 1024) throw new PanelRecordError("Şifrenizi girin.");
      result = await manageFactor(requiredText(input.action, "İşlem"), input.password, String(input.code ?? ""));
    }
    else {
      const companyId = requiredText(input.companyId, "Firma"); await assertPanelCompanyAccess(companyId);
      if (feature === "site") {
        if (input.action === "save") result = await saveSiteDraft(companyId, input.version, input.content);
        else if (input.action === "publish") { result = await publishSiteDraft(companyId, input.version); revalidatePath("/", "layout"); }
        else throw new PanelRecordError("Geçersiz yayın işlemi.");
      } else if (feature === "package") result = await saveCompanyPackage(companyId, input.version, input.package);
      else if (feature === "pricing") { result = await bulkPricing(companyId, input.ids, input.period, input.preview !== false); if (input.preview === false) revalidatePath("/", "layout"); }
      else if (feature === "sharing") { result = input.action === "offer" ? await offerPortfolio(input) : await respondPortfolio(companyId, requiredText(input.id, "Paylaşım"), input.version, input.action); revalidatePath("/", "layout"); }
      else if (feature === "first-user") {
        const branch = (await getDemoBranches()).find(row => row.companyId === companyId);
        if (!branch) throw new PanelRecordError("Önce firmaya bir şube tanımlayın.");
        const password = requiredText(input.password, "Şifre", 1024); if (password.length < 12) throw new PanelRecordError("En az 12 karakter şifre girin.");
        result = await createDemoTeamUser({ branchId: branch.id, roleId: "ADMIN", status: "ACTIVE", fullName: requiredText(input.fullName, "Ad soyad"), username: requiredText(input.username, "Kullanıcı adı"),
          email: requiredText(input.email, "E-posta"), phone: requiredText(input.phone, "Telefon"), password });
      }
    }
    return NextResponse.json(result ?? { ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return panelRecordErrorResponse(error); }
}
