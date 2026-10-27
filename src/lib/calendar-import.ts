import ICAL from "ical.js";
import { isDateKey, shiftDateKey } from "@/lib/booking-dates";

export const MAX_CALENDAR_BYTES = 2 * 1024 * 1024;
export const MAX_CALENDAR_EVENTS = 2000;
export type ImportedCalendarEvent = { uid: string; startDate: string; endDate: string };
export class CalendarImportError extends Error {}

function fail(message = "Gecerli ve eksiksiz bir iCal takvimi okunamadi."): never {
  throw new CalendarImportError(message);
}

function dateInTurkey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function readDate(property: ICAL.Property) {
  // Validate the original value before ICAL.Time can normalize an impossible date.
  const raw = property.toJSON()[3];
  if (typeof raw !== "string" || !isDateKey(raw.slice(0, 10))) fail("Takvimde gecersiz bir tarih var; onceki doluluk korundu.");
  const time = property.getFirstValue() as ICAL.Time;
  if (!(time instanceof ICAL.Time)) fail();
  if (time.isDate) return { date: raw, instant: Date.parse(`${raw}T00:00:00Z`), allDay: true };
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/.test(raw) || time.hour > 23 || time.minute > 59 || time.second > 59) fail();
  const tzid = property.getParameter("tzid");
  if (tzid && typeof tzid !== "string") fail();
  let date: Date;
  if (raw.endsWith("Z")) {
    date = new Date(raw);
  } else {
    // Floating timestamps are interpreted in the property's local timezone (Turkey).
    const zone = tzid || "Europe/Istanbul";
    let formatter: Intl.DateTimeFormat;
    try {
      formatter = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    } catch {
      fail("Takvimde desteklenmeyen bir saat dilimi var. IANA saat dilimi veya UTC kullanin.");
    }
    const target = Date.parse(`${raw}Z`);
    let instant = target;
    for (let i = 0; i < 3; i++) {
      const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map((part) => [part.type, part.value]));
      const wall = Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`);
      if (wall === target) break;
      instant += target - wall;
    }
    date = new Date(instant);
    const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
    if (`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}` !== raw) fail("Takvimde saat degisimine denk gelen gecersiz bir saat var.");
  }
  if (!Number.isFinite(date.getTime())) fail();
  return { date: dateInTurkey(date), instant: date.getTime(), allDay: false };
}

export function parseRentalCalendar(text: string): ImportedCalendarEvent[] {
  try {
    if (Buffer.byteLength(text, "utf8") > MAX_CALENDAR_BYTES) fail("Takvim dosyasi 2 MB sinirini asiyor.");
    const lines = text.replace(/^\uFEFF/, "").replace(/\r\n|\r/g, "\n").replace(/\n[ \t]/g, "").trim().split("\n");
    if (lines.length > 30000 || lines[0] !== "BEGIN:VCALENDAR" || lines.at(-1) !== "END:VCALENDAR") fail();
    const stack: string[] = [];
    let calendars = 0;
    for (const line of lines) {
      if (line.startsWith("BEGIN:")) {
        const parent = stack.at(-1);
        const child = line.slice(6);
        if ((parent === undefined && child !== "VCALENDAR") ||
            (parent === "VCALENDAR" && !["VEVENT", "VTIMEZONE"].includes(child)) ||
            (parent === "VEVENT" && child !== "VALARM") ||
            (parent === "VTIMEZONE" && !["STANDARD", "DAYLIGHT"].includes(child)) ||
            (parent !== undefined && !["VCALENDAR", "VEVENT", "VTIMEZONE"].includes(parent))) fail();
        stack.push(line.slice(6));
        if (line === "BEGIN:VCALENDAR") calendars++;
        if (stack.length > 6) fail();
      } else if (line.startsWith("END:") && stack.pop() !== line.slice(4)) fail();
    }
    if (stack.length || calendars !== 1) fail();
    const calendar = new ICAL.Component(ICAL.parse(lines.join("\r\n")));
    if (calendar.name !== "vcalendar" || calendar.getFirstPropertyValue("version") !== "2.0") fail();
    if (calendar.getAllProperties("version").length !== 1 || calendar.getAllProperties("method").length > 1) fail();
    const method = String(calendar.getFirstPropertyValue("method") ?? "").toUpperCase();
    if (method && method !== "PUBLISH") fail("Tam takvim gerekli; davet/iptal bildirimi bir doluluk takvimi degildir.");
    if (calendar.getAllSubcomponents().some((item) => !["vevent", "vtimezone"].includes(item.name))) fail();
    const components = calendar.getAllSubcomponents("vevent");
    if (components.length > MAX_CALENDAR_EVENTS) fail("Takvimde en fazla 2000 kayit desteklenir.");
    const seen = new Set<string>();
    const events: ImportedCalendarEvent[] = [];
    for (const component of components) {
      // Rental feeds publish individual stays. Never silently drop unsupported recurrences.
      if (["rrule", "rdate", "exdate", "exrule", "recurrence-id"].some((name) => component.hasProperty(name))) {
        fail("Tekrarlayan etkinlik desteklenmiyor. Her konaklamayi ayri kayit olarak yayinlayan doluluk takvimini kullanin; onceki doluluk korundu.");
      }
      const uid = component.getFirstPropertyValue("uid");
      if (typeof uid !== "string" || !uid.trim() || uid.length > 1024 || seen.has(uid)) fail("Takvimde eksik veya yinelenen etkinlik kimligi var; onceki doluluk korundu.");
      seen.add(uid);
      if (["dtstart", "dtend", "uid", "status", "transp"].some((name) => component.getAllProperties(name).length > 1)) fail();
      if (String(component.getFirstPropertyValue("status")).toUpperCase() === "CANCELLED" || String(component.getFirstPropertyValue("transp")).toUpperCase() === "TRANSPARENT") continue;
      const startProperty = component.getFirstProperty("dtstart");
      const endProperty = component.getFirstProperty("dtend");
      if (!startProperty || component.hasProperty("duration")) fail("DTSTART ve DTEND tarihli konaklama kayitlari gerekli. DURATION desteklenmiyor.");
      const start = readDate(startProperty);
      const end = endProperty ? readDate(endProperty) : start.allDay
        ? { date: shiftDateKey(start.date, 1), instant: start.instant + 86400000, allDay: true } : fail("Saatli etkinlikte DTEND eksik.");
      if (start.allDay !== end.allDay || end.instant <= start.instant) fail("Takvimde gecersiz bir konaklama araligi var; onceki doluluk korundu.");
      const endDate = end.date > start.date ? end.date : shiftDateKey(start.date, 1);
      // DTEND is exclusive: the checkout day stays available for the next arrival.
      events.push({ uid, startDate: start.date, endDate });
    }
    return events;
  } catch (error) {
    if (error instanceof CalendarImportError) throw error;
    return fail();
  }
}
