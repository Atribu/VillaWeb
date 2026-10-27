import "server-only";
import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import * as ipaddr from "ipaddr.js";
import { CalendarImportError, MAX_CALENDAR_BYTES } from "@/lib/calendar-import";

export function isPublicCalendarAddress(address: string) {
  try {
    const parsed = ipaddr.process(address);
    return parsed.range() === "unicast" && (parsed.kind() !== "ipv6" || (parsed as ipaddr.IPv6).match(ipaddr.parse("2000::") as ipaddr.IPv6, 3));
  } catch { return false; }
}

export function normalizeCalendarUrl(value: string) {
  try {
    if (typeof value !== "string" || value.length > 4096) throw new Error();
    const url = new URL(value.trim().replace(/^webcal:/i, "https:"));
    const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.hash || url.port ||
        !host.includes(":") && !host.includes(".") || /\.(localhost|local|internal|test|invalid|example)\.?$/.test(host) ||
        (isIP(host) && !isPublicCalendarAddress(host))) throw new Error();
    return url.toString();
  } catch { throw new CalendarImportError("Herkese acik bir HTTP/HTTPS iCal adresi girin. Yerel adresler, ozel portlar ve kullanici bilgisi iceren URL'ler kabul edilmez."); }
}

async function readResponse(url: URL, signal: AbortSignal): Promise<{ body?: string; redirect?: string }> {
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }]
    : await Promise.race([
      lookup(hostname, { all: true, verbatim: true }),
      new Promise<never>((_, reject) => {
        if (signal.aborted) reject(new CalendarImportError("Takvim baglantisi zaman asimina ugradi."));
        else signal.addEventListener("abort", () => reject(new CalendarImportError("Takvim baglantisi zaman asimina ugradi.")), { once: true });
      }),
    ]);
  if (!addresses.length || addresses.some((item) => !isPublicCalendarAddress(item.address))) throw new CalendarImportError("Takvim adresi guvenli bir genel IP adresine cozumlenmedi.");
  const pinned = addresses.find((item) => item.family === 4) ?? addresses[0];
  return new Promise((resolve, reject) => {
    // Pin validated DNS results to the socket; redirects are separately validated.
    const req = (url.protocol === "https:" ? httpsRequest : httpRequest)(url, {
      signal, agent: false, family: pinned.family,
      lookup: (_host, options, callback) => options.all
        ? callback(null, [pinned]) : callback(null, pinned.address, pinned.family),
      headers: { Accept: "text/calendar, text/plain;q=0.9", "Accept-Encoding": "identity", "User-Agent": "BookToVilla-CalendarSync/1.0" },
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode ?? 0)) {
        const redirect = res.headers.location;
        res.destroy();
        if (!redirect) reject(new CalendarImportError("Takvim yonlendirmesi gecersiz."));
        else resolve({ redirect });
        return;
      }
      if (res.statusCode !== 200) { res.destroy(); reject(new CalendarImportError(`Takvim sunucusu HTTP ${res.statusCode ?? 0} yaniti verdi; onceki doluluk korundu.`)); return; }
      if (res.headers["content-encoding"] && res.headers["content-encoding"] !== "identity") {
        res.destroy(); reject(new CalendarImportError("Sikistirilmis takvim yaniti desteklenmiyor.")); return;
      }
      if (Number(res.headers["content-length"]) > MAX_CALENDAR_BYTES) {
        res.destroy(); reject(new CalendarImportError("Takvim dosyasi 2 MB sinirini asiyor.")); return;
      }
      const chunks: Buffer[] = [];
      let bytes = 0;
      res.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > MAX_CALENDAR_BYTES) {
          res.destroy(); reject(new CalendarImportError("Takvim dosyasi 2 MB sinirini asiyor."));
        } else chunks.push(chunk);
      });
      res.on("end", () => resolve({ body: Buffer.concat(chunks).toString("utf8") }));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.end();
  });
}

export async function fetchRentalCalendar(value: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    let url = new URL(normalizeCalendarUrl(value));
    for (let redirect = 0; redirect <= 3; redirect++) {
      const result = await readResponse(url, controller.signal);
      if (result.body !== undefined) return result.body;
      const next = new URL(normalizeCalendarUrl(new URL(result.redirect!, url).toString()));
      if (url.protocol === "https:" && next.protocol !== "https:") throw new CalendarImportError("HTTPS takvimi guvensiz HTTP adresine yonlendirilemez.");
      url = next;
    }
    throw new CalendarImportError("Takvim cok fazla yonlendirme yapiyor.");
  } catch (error) {
    if (error instanceof CalendarImportError) throw error;
    throw new CalendarImportError("Takvim indirilemedi veya baglanti zaman asimina ugradi; onceki doluluk korundu.");
  } finally { clearTimeout(timer); }
}
