import "server-only";
import { createHmac, randomUUID, timingSafeEqual, createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getUserSession } from "@/lib/auth/server-session";
import { assertPanelCompanyAccess } from "@/lib/server/demo-company-context";
import { PanelRecordError } from "@/lib/panel-record-tools";
import { hasPermission } from "@/lib/auth/permissions";

export function runtimeDirectory() { return process.env.VILLA_RUNTIME_DIRECTORY || path.join(process.cwd(), ".villa-runtime"); }
function stagingDirectory() { return path.join(runtimeDirectory(), "staged"); }
function secret() {
  const configured = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && (!configured || configured.length < 32)) throw new Error("SESSION_SECRET required.");
  return configured || "villaweb-local-staging-secret";
}
type Receipt = { id: string; userId: string; companyId: string; name: string; size: number; sha256: string; expiresAt: number };
function sign(body: string) { return createHmac("sha256", secret()).update(`villa-image:${body}`).digest("base64url"); }
export async function stageConvertedImage(companyId: string, name: string, buffer: Buffer) {
  const actor = await getUserSession();
  if (!actor || !hasPermission(actor.role, "villas")) throw new PanelRecordError("Yükleme yetkisi bulunamadı.", 403);
  await assertPanelCompanyAccess(companyId);
  const receipt: Receipt = { id: randomUUID(), companyId, userId: actor.id, name: `${name.slice(0, 180)}.webp`, size: buffer.length,
    sha256: createHash("sha256").update(buffer).digest("hex"), expiresAt: Date.now() + 24 * 3600 * 1000 };
  await mkdir(stagingDirectory(), { recursive: true, mode: 0o700 });
  await writeFile(path.join(stagingDirectory(), `${receipt.id}.webp`), buffer, { flag: "wx", mode: 0o600 });
  const body = Buffer.from(JSON.stringify(receipt)).toString("base64url");
  return { token: `${body}.${sign(body)}`, expiresAt: receipt.expiresAt };
}
export class StagedVillaImage extends File {
  constructor(private receipt: Receipt) { super([], receipt.name, { type: "image/webp" }); }
  override get size() { return this.receipt.size; }
  override async arrayBuffer(): Promise<ArrayBuffer> {
    let buffer: Buffer;
    try { buffer = await readFile(path.join(stagingDirectory(), `${this.receipt.id}.webp`)); }
    catch { throw new PanelRecordError("Hazırlanan görsel bulunamadı. Dosyayı kaldırıp yeniden seçin."); }
    if (buffer.length !== this.receipt.size || createHash("sha256").update(buffer).digest("hex") !== this.receipt.sha256) throw new PanelRecordError("Hazırlanan görsel doğrulanamadı.");
    return Uint8Array.from(buffer).buffer;
  }
}
export async function readStagedImages(form: FormData, companyId: string): Promise<File[]> {
  const tokens = form.getAll("stagedImages");
  if (!tokens.length) return [];
  const actor = await getUserSession();
  if (!actor || !hasPermission(actor.role, "villas")) throw new PanelRecordError("Yükleme yetkisi bulunamadı.", 403);
  await assertPanelCompanyAccess(companyId);
  if (new Set(tokens).size !== tokens.length) throw new PanelRecordError("Aynı görsel birden fazla seçilmiş.");
  return tokens.map(token => {
    if (typeof token !== "string" || token.length > 4096) throw new PanelRecordError("Geçersiz görsel kaydı.");
    const parts = token.split("."); const [body, signature] = parts;
    if (parts.length !== 2 || !body || !signature || Buffer.byteLength(signature) !== Buffer.byteLength(sign(body)) || !timingSafeEqual(Buffer.from(signature), Buffer.from(sign(body)))) throw new PanelRecordError("Görsel imzası geçersiz.", 403);
    let row: Receipt; try { row = JSON.parse(Buffer.from(body, "base64url").toString()); } catch { throw new PanelRecordError("Geçersiz görsel kaydı."); }
    if (row.companyId !== companyId || row.userId !== actor.id) throw new PanelRecordError("Görsel bu kullanıcıya ve firmaya ait değil.", 403);
    if (!/^[0-9a-f-]{36}$/.test(row.id) || !Number.isFinite(row.expiresAt) || row.expiresAt <= Date.now()) throw new PanelRecordError("Görsel yüklemesinin süresi dolmuş. Yeniden yükleyin.");
    return new StagedVillaImage(row);
  });
}
