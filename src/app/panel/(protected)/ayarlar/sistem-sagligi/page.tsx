import { PanelPageHeader } from "@/components/panel/panel-page-header";
import { getSystemHealth } from "@/lib/server/system-health";
export const dynamic = "force-dynamic";
export default async function SystemHealthPage() {
  const data = await getSystemHealth();
  return <div className="work-stack"><PanelPageHeader eyebrow="Platform / Süper admin" title="Sistem sağlığı" description="Veritabanı, depolama, yedekleme ve son yükleme hataları. Verileri değiştirmeyen durum ekranı." />
    <div className="work-stats"><div><strong>{data.memoryMb} MB</strong><span>Uygulama işlem belleği</span></div><div><strong>{data.uptimeMinutes} dk</strong><span>Bu işlemin çalışma süresi</span></div><div><strong>{data.checks.filter(row => row.status !== "ok").length}</strong><span>Kontrol gerektiren konu</span></div></div>
    <section className="work-card"><h2>Kontroller</h2>{data.checks.map(row => <div className="work-row" key={row.name}><div><h3>{row.name}</h3><p>{row.detail}</p></div><span className={`work-badge ${row.status !== "ok" ? "is-alert" : ""}`}>{row.status === "ok" ? "Uygun" : row.status === "error" ? "Hata" : "Kontrol edin"}</span></div>)}<p className="work-muted">Kontrol zamanı: {new Date(data.checkedAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}. Güncel durum için sayfayı yenileyin.</p></section>
    <section className="work-card"><h2>Son yükleme / sistem hataları</h2><p className="work-muted">Son 50 olay. Kişisel veri ve gizli bağlantılar kaydedilmez. Ayrıntılı neden için aynı zamandaki sunucu loguna bakın.</p>{data.events.map(row => <div className="work-row" key={row.id}><div><h3>{row.kind}</h3><p>{row.errorCode} · {row.at}</p></div><code>{row.id.slice(0, 8)}</code></div>)}{!data.events.length && <p className="work-empty">Bu sunucuda henüz kayıtlı olay yok.</p>}</section>
  </div>;
}
