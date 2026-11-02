"use client";
import { useRouter } from "next/navigation";
import type { PortfolioShare } from "@/lib/server/portfolio-sharing";
import { formatCurrency } from "@/lib/villa-catalog";
import { Field, usePlatformAction } from "./platform-controls";
export function PortfolioSharing({ companyId, villas, shares }: { companyId: string; villas: { id: string; title: string }[]; shares: (PortfolioShare & { title: string; sourceName: string; recipientName: string })[] }) {
  const action = usePlatformAction(); const router = useRouter();
  return <div className="work-stack">{action.feedback}<form className="work-card grid gap-4 md:grid-cols-2" onSubmit={async event => {
    event.preventDefault(); const form = event.currentTarget; const fields = Object.fromEntries(new FormData(form));
    if (!window.confirm("Seçilen villa, belirtilen firmaya bu fiyat ve komisyonla paylaşım teklifi olarak gönderilsin mi?")) return;
    if (await action.run("sharing", { ...fields, companyId, action: "offer" })) { form.reset(); router.refresh(); }
  }}><h2 className="text-lg font-semibold md:col-span-2">Yeni paylaşım teklifi</h2><Field label="Firmanıza ait aktif villa"><select name="villaId" className="panel-input" required><option value="">Villa seçin</option>{villas.map(villa => <option key={villa.id} value={villa.id}>{villa.title}</option>)}</select></Field>
    <Field label="Alıcı firmanın kodu (slug)"><input className="panel-input" name="recipientSlug" placeholder="ornek-firma" required /></Field><Field label="İş ortağı sitesinde gecelik satış fiyatı (TL)"><input name="nightlyPrice" type="number" min="1" step="0.01" className="panel-input" required /></Field><Field label="Satışı yapan firmaya komisyon (%)"><input name="commissionPercent" type="number" min="0" max="100" step="0.01" className="panel-input" required /></Field>
    <p className="text-sm leading-6 text-slate-600 md:col-span-2">Alıcı kabul edince kendi sitesinde listelenir. Paylaşım fiyatı dönem fiyatını değiştirir; asıl villanın minimum gece, temizlik ve doluluk bilgileri korunur. Komisyon indirimlerden sonraki konaklama bedelinden hesaplanır; temizlik dahil edilmez. Misafir ve muhasebe bilgileri yalnızca satışı yapan firmada kalır.</p><button className="panel-button-primary" disabled={action.busy || !villas.length}>Onaya gönder</button></form>
    <section className="work-card"><h2 className="mb-5 text-lg font-semibold">Gelen ve gönderilen paylaşımlar</h2>{shares.length === 0 && <p className="text-sm text-slate-500">Henüz paylaşım yok. Hiçbir villa otomatik paylaşılmaz.</p>}
      <div className="space-y-3">{shares.map(share => <article key={share.id} className="grid gap-3 rounded-lg border border-slate-200 p-4 lg:grid-cols-[1fr_auto]"><div><p className="font-semibold">{share.title}</p><p className="mt-1 text-sm text-slate-500">{share.sourceName} → {share.recipientName}</p><p className="mt-2 text-sm">{formatCurrency(share.nightlyPrice)} / gece · Komisyon %{share.commissionPercent} · {share.state === "ACTIVE" ? "Yayında" : share.state === "PENDING" ? "Onay bekliyor" : "Geri çekildi"}</p></div><div className="flex flex-wrap items-center gap-2">
        {share.recipientCompanyId === companyId && share.state === "PENDING" && <button disabled={action.busy} className="panel-button-primary" onClick={async () => { if (window.confirm("Paylaşım koşullarını kabul edip villayı sitenizde yayınlamak istiyor musunuz?")) { if (await action.run("sharing", { companyId, id: share.id, version: share.version, action: "accept" })) router.refresh(); } }}>Koşulları kabul et</button>}
        {share.state !== "REVOKED" && <button disabled={action.busy} className="panel-button-secondary" onClick={async () => { if (window.confirm("Paylaşım geri çekilsin mi? Yeni talepler kapanır; onaylanmış rezervasyonlar korunur.")) { if (await action.run("sharing", { companyId, id: share.id, version: share.version, action: "revoke" })) router.refresh(); } }}>Geri çek</button>}
      </div></article>)}</div></section></div>;
}
