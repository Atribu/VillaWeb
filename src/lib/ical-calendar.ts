export type CalendarEvent = {
  id: string;
  startDate: string;
  endDate: string;
  summary: string;
  updatedAt?: Date;
};

function escapeText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll(";", "\\;")
    .replaceAll(",", "\\,").replaceAll(/\r\n|\r|\n/g, "\\n");
}

function foldLine(line: string) {
  const encoder = new TextEncoder();
  const lines: string[] = [];
  let part = "";
  let bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > 75) {
      lines.push(part);
      part = " ";
      bytes = 1;
    }
    part += character;
    bytes += size;
  }
  return [...lines, part].join("\r\n");
}

export function buildCalendar(input: { companyId: string; title: string; events: CalendarEvent[] }) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BookToVilla//Availability//TR",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${escapeText(input.title)} - Uygunluk`];
  for (const event of input.events) {
    lines.push("BEGIN:VEVENT",
      `UID:${escapeText(`${event.id}@${input.companyId}.booktovilla`)}`,
      `DTSTAMP:${(event.updatedAt ?? new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
      `DTSTART;VALUE=DATE:${event.startDate.replaceAll("-", "")}`,
      `DTEND;VALUE=DATE:${event.endDate.replaceAll("-", "")}`,
      `SUMMARY:${escapeText(event.summary)}`, "STATUS:CONFIRMED", "TRANSP:OPAQUE", "END:VEVENT");
  }
  return [...lines, "END:VCALENDAR"].map(foldLine).join("\r\n") + "\r\n";
}
