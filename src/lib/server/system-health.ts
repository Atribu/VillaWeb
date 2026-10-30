import "server-only";
import { randomUUID } from "node:crypto";
import { access, mkdir, readdir, readFile, statfs, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { runtimeDirectory } from "@/lib/server/staged-villa-images";
import { requirePanelPermission } from "@/lib/server/panel-work-records";
import { isDevelopmentFallbackForced } from "@/lib/server/development-fallback";

export async function recordSystemEvent(kind: string, error: unknown) {
  const id = randomUUID();
  // Never persist guest data, credentials, URLs or raw exception messages in health events.
  const errorCode = typeof error === "object" && error && "code" in error && /^[A-Z0-9_]{2,30}$/.test(String(error.code)) ? String(error.code) : "UNCLASSIFIED";
  const event = { id, kind, errorCode, at: new Date().toISOString() };
  try { const root = path.join(runtimeDirectory(), "events"); await mkdir(root, { recursive: true, mode: 0o700 }); await writeFile(path.join(root, `${Date.now()}-${id}.json`), JSON.stringify(event), { mode: 0o600 }); }
  catch { console.error("Health event storage unavailable", { id, kind, errorCode }); }
  return id;
}
export async function getSystemHealth() {
  await requirePanelPermission("companies");
  const checks: { name: string; status: "ok" | "warning" | "error"; detail: string }[] = [];
  if (isDevelopmentFallbackForced()) checks.push({ name: "Veritabanı", status: "warning", detail: "Yerel fallback açık. PostgreSQL bağlantısı bu ortamda doğrulanmıyor." });
  else try { await db.$queryRaw`SELECT 1`; await db.panelWorkRecord.count(); checks.push({ name: "Veritabanı", status: "ok", detail: "PostgreSQL bağlantısı ve yeni panel tablosu erişilebilir." }); }
  catch { checks.push({ name: "Veritabanı", status: "error", detail: "Bağlantı veya migration kontrolü başarısız. Sunucu loglarını kontrol edin." }); }
  try { const root = path.join(process.cwd(), "public", "uploads", "villas"); await access(root, constants.W_OK | constants.R_OK);
    const stats = await statfs(root); const available = stats.bavail * stats.bsize; const total = stats.blocks * stats.bsize;
    checks.push({ name: "Görsel depolama", status: available / total < 0.1 ? "warning" : "ok", detail: `Klasör erişilebilir. ${(available / 1024 ** 3).toFixed(1)} GB boş alan (${Math.round(available / total * 100)}%).` });
  } catch { checks.push({ name: "Görsel depolama", status: "error", detail: "Upload klasörü veya izinleri kontrol edilmeli." }); }
  const runtime = runtimeDirectory();
  try { await mkdir(runtime, { recursive: true, mode: 0o700 }); await access(runtime, constants.W_OK | constants.R_OK); checks.push({ name: "Geçici yüklemeler / günlükler", status: "ok", detail: "Özel çalışma dizini erişilebilir." }); }
  catch { checks.push({ name: "Geçici yüklemeler / günlükler", status: "error", detail: "VILLA_RUNTIME_DIRECTORY yazılabilir olmalı." }); }
  checks.push({ name: "iCal zamanlayıcı ayarı", status: process.env.CALENDAR_SYNC_SECRET && (process.env.CALENDAR_SYNC_APP_URL || process.env.APP_URL) ? "ok" : "warning", detail: "Ortam değişkenlerinin varlığı kontrol edilir; çalışan cron/timer ayrıca sunucuda doğrulanmalı." });
  let backup: { finishedAt?: string; verifiedAt?: string; lastRestoreTestAt?: string; status?: string } = {};
  try { backup = JSON.parse(await readFile(path.join(runtime, "backup-status.json"), "utf8")); } catch { /* No backup has run on this instance. */ }
  const backupFresh = backup.status === "ok" && Boolean(backup.finishedAt) && Date.now() - Date.parse(backup.finishedAt!) < 36 * 3600 * 1000;
  checks.push({ name: "Son yedek", status: backupFresh ? "ok" : "warning", detail: backup.finishedAt ? `${backup.finishedAt} · ${backup.status === "ok" ? "Arşiv ve checksum doğrulandı" : "Son deneme başarısız"}` : "Henüz doğrulanmış yedek yok. Sunucuda backup komutu ve timer kurulmalı." });
  checks.push({ name: "Geri yükleme testi", status: backup.lastRestoreTestAt && Date.now() - Date.parse(backup.lastRestoreTestAt) < 31 * 86400000 ? "ok" : "warning", detail: backup.lastRestoreTestAt ?? "Henüz ayrı test veritabanına geri yükleme testi yapılmadı." });
  const events: { id: string; kind: string; errorCode: string; at: string }[] = [];
  try { const root = path.join(runtime, "events"); const names = (await readdir(root)).filter(name => /^\d+-[0-9a-f-]+\.json$/.test(name)).sort().reverse().slice(0, 50);
    for (const name of names) { try { events.push(JSON.parse(await readFile(path.join(root, name), "utf8"))); } catch { /* Incomplete event is skipped. */ } }
  } catch { /* Empty health journal. */ }
  const memory = process.memoryUsage();
  return { checks, events, memoryMb: Math.round(memory.rss / 1024 ** 2), uptimeMinutes: Math.floor(process.uptime() / 60), checkedAt: new Date().toISOString() };
}
