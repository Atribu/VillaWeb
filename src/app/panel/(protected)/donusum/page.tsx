import { platformPage } from "@/lib/server/platform-page";
import { conversionReport } from "@/lib/server/conversion-report";
import { todayInTurkey, shiftDateKey } from "@/lib/booking-dates";
import { TRAFFIC_SOURCES } from "@/lib/platform-features";
import { PanelPageHeader } from "@/components/panel/panel-page-header";
export const dynamic = "force-dynamic";
const labels: Record<string, string> = { DIRECT: "Doğrudan", SEARCH: "Arama", SOCIAL: "Sosyal medya", EMAIL: "E-posta", REFERRAL: "Yönlendirme", PANEL: "Panel", UNKNOWN: "Kaynağı bilinmiyor" };
export default async function ConversionPage({ searchParams }: { searchParams: Promise<{ companyId?: string; start?: string; end?: string; source?: string }> }) {
  const params = await searchParams; const context = await platformPage("reports", params.companyId);
  const start = params.start ?? shiftDateKey(todayInTurkey(), -29), end = params.end ?? todayInTurkey();
  let data; let error = "";
  try { data = await conversionReport(context.company.id, start, end, params.source); } catch (e) { error = e instanceof Error ? e.message : "Rapor okunamadı."; }
  return <div className="work-stack"><PanelPageHeader eyebrow="Satış performansı" title="Dönüşüm raporu" description="Villa incelemelerini, gelen talepleri ve onaylanan rezervasyonları birlikte izleyin." />
    <form className="work-card flex flex-wrap items-end gap-4" method="GET"><label className="grid gap-2 text-sm">Firma<select className="panel-input" name="companyId" defaultValue={context.company.id}>{context.companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
      <label className="grid gap-2 text-sm">Başlangıç<input className="panel-input" type="date" name="start" defaultValue={start} min={shiftDateKey(todayInTurkey(), -90)} max={todayInTurkey()} /></label><label className="grid gap-2 text-sm">Bitiş<input className="panel-input" type="date" name="end" defaultValue={end} max={todayInTurkey()} /></label>
      <label className="grid gap-2 text-sm">Talep kaynağı<select className="panel-input" name="source" defaultValue={params.source ?? ""}><option value="">Tüm kaynaklar</option>{TRAFFIC_SOURCES.map(source => <option key={source} value={source}>{labels[source]}</option>)}</select></label><button className="panel-button-primary">Raporla</button></form>
    {error && <p role="alert" className="work-card text-red-700">{error}</p>}{data && <><div className="grid gap-4 sm:grid-cols-3">{[["Günlük tekil inceleme", data.totalViews], ["Gelen talep", data.totalRequests], ["Onaylı rezervasyon", data.totalApproved]].map(([label, count]) => <section className="work-card" key={label}><p className="text-sm text-slate-500">{label}</p><strong className="mt-2 block text-3xl">{count}</strong></section>)}</div>
      <section className="work-card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Villa", "İnceleme", "Talep", "Onay", "İnceleme / talep oranı", "Talep / onay oranı"].map(label => <th className="whitespace-nowrap border-b p-3" key={label}>{label}</th>)}</tr></thead><tbody>{data.rows.map(row => <tr key={row.id}><td className="min-w-40 border-b p-3 font-medium">{row.title}</td>{[row.views, row.inquiries, row.approved, row.viewToInquiry === null ? "—" : `%${row.viewToInquiry}`, row.inquiryToBooking === null ? "—" : `%${row.inquiryToBooking}`].map((value, index) => <td key={index} className="border-b p-3">{value}</td>)}</tr>)}</tbody></table></section></>}
    <p className="text-xs leading-6 text-slate-500">Eski taleplerde kaynak kaydedilmemişse Kaynağı bilinmiyor olarak gösterilir. İncelemeler aynı tarayıcı, villa ve gün için tek sayılır; gerçek kişi sayısı değildir. Ölçüm bu sürümden itibaren başlar, geçmiş görüntülenmeler üretilmez. Talepler oluşturulma tarihine göre, onaylar bu taleplerin güncel durumuna göre hesaplanır. Manuel talepler inceleme / talep oranına dahil edilmez. Bu oranlar birebir kullanıcı takibi değil dönemsel aktivite oranlarıdır. Anonim inceleme kayıtları 90 gün tutulur; IP veya ziyaret edilen URL kaydedilmez.</p>
  </div>;
}
