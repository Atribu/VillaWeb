import type { PanelActivity } from "@/lib/panel-record-tools";

const labels: Record<string, string> = { REQUEST_NOTE: "Ekip notu", STATUS_CHANGED: "Durum değişikliği", VILLA_UPDATED: "Villa düzenleme", PRICE_CHANGED: "Fiyat değişikliği", GALLERY_UPDATED: "Galeri düzenleme", BULK_STATUS_CHANGED: "Toplu durum değişikliği", CREATED: "Talep oluşturuldu", SEASONAL_PRICE_CHANGED: "Fiyat dönemi" };
export function RecordActivity({ activity }: { activity: PanelActivity[] }) {
  return <div className="mt-5"><p className="text-xs leading-5 text-slate-500">Son 200 kayıt gösterilir. Yeni işlem izleri bu özellik etkinleştirildikten sonra tutulur; eski işlemlerin kullanıcısı geriye dönük tahmin edilmez.</p>
    {!activity.length ? <p className="py-6 text-sm text-slate-500">Henüz kayıtlı işlem yok.</p> : <ol className="panel-activity-list">
      {activity.map(item => <li key={item.id}><div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500"><span>{labels[item.action] ?? "İşlem"} · {item.actor}</span><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{item.summary}</p></li>)}
    </ol>}</div>;
}
