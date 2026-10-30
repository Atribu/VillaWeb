import Link from "next/link";
import { PanelPageHeader } from "@/components/panel/panel-page-header";
import { PortfolioCalendar } from "@/components/panel/portfolio-calendar";
import { requirePanelPermission } from "@/lib/server/panel-work-records";
import { hasPermission } from "@/lib/auth/permissions";
import { getDemoVillas } from "@/lib/server/demo-villa-store";
import { getAllCompanyRecords } from "@/lib/server/company-store";
import { todayInTurkey, isDateKey } from "@/lib/booking-dates";
export const dynamic = "force-dynamic";
export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const actor = await requirePanelPermission("calendar"); const params = await searchParams; const today = todayInTurkey();
  const month = params.month && /^\d{4}-\d{2}$/.test(params.month) && isDateKey(`${params.month}-01`) ? params.month : today.slice(0, 7);
  const date = new Date(`${month}-01T12:00:00Z`); const prev = new Date(date); prev.setUTCMonth(prev.getUTCMonth() - 1); const next = new Date(date); next.setUTCMonth(next.getUTCMonth() + 1);
  const companies = await getAllCompanyRecords();
  const villas = (await getDemoVillas({ includeMetrics: false })).map(row => ({ id: row.id, slug: row.slug, title: row.title, company: companies.find(c => c.id === row.companyId)?.shortName ?? "", location: row.locationLabel,
    ranges: row.availabilityRanges.map(range => ({ ...range, label: range.sourceRequestId && !hasPermission(actor.role, "reservations") ? "Rezervasyon" : range.label, sourceRequestId: hasPermission(actor.role, "reservations") ? range.sourceRequestId : undefined })) }));
  return <div className="work-stack"><PanelPageHeader eyebrow="Takvim" title="Portföy doluluk takvimi" description="Tüm villaların rezervasyon, bakım ve kapalı tarihlerini birlikte inceleyin." />
    <div className="work-toolbar"><Link className="panel-button-secondary" href={`?month=${prev.toISOString().slice(0, 7)}`}>Önceki ay</Link><h2>{date.toLocaleDateString("tr-TR", { month: "long", year: "numeric", timeZone: "Europe/Istanbul" })}</h2><Link className="panel-button-secondary" href={`?month=${next.toISOString().slice(0, 7)}`}>Sonraki ay</Link><Link href="/panel/takvim">Bugün</Link><form className="work-actions"><input name="month" type="month" defaultValue={month} aria-label="Ay seçin" /><button className="panel-button-secondary">Git</button></form></div>
    <PortfolioCalendar villas={villas} month={month} today={today} canEdit={hasPermission(actor.role, "villas")} canSeeRequests={hasPermission(actor.role, "reservations")} />
  </div>;
}
