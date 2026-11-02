"use client";
import { useState } from "react";
import { PACKAGE_MODULES, type PlatformConfig, type CompanyPackage } from "@/lib/platform-features";
import { Field, usePlatformAction } from "./platform-controls";
const labels: Record<string, string> = { pricing: "Fiyatlandırma", reservations: "Rezervasyonlar", operations: "Operasyon", finance: "Muhasebe", crm: "CRM", calendar: "Takvim", reports: "Raporlar", websites: "Web siteleri", sharing: "Portföy paylaşımı" };
export function CompanyPackageEditor({ initial, usage }: { initial: PlatformConfig; usage: { users: number; activeVillas: number } }) {
  const [config, setConfig] = useState(initial); const [value, setValue] = useState<CompanyPackage>(initial.package); const action = usePlatformAction();
  return <form className="work-card grid gap-5 md:grid-cols-2" onSubmit={async event => { event.preventDefault(); if (!window.confirm("Firma paketi ve modül erişimleri güncellensin mi?")) return;
    const result = await action.run<PlatformConfig>("package", { companyId: config.companyId, version: config.version, package: value }); if (result) setConfig(result);
  }}><div className="md:col-span-2">{action.feedback}<p className="mb-4 text-sm text-slate-600">Mevcut kullanım: {usage.users} kullanıcı · {usage.activeVillas} aktif villa. Mevcut kayıtlar silinmez; kullanımın altında limit kaydedilemez.</p></div>
    <Field label="Paket adı"><input className="panel-input" required value={value.name} onChange={e => setValue({ ...value, name: e.target.value })} /></Field>
    {([ ["users", "Kullanıcı limiti"], ["activeVillas", "Aktif villa limiti"] ] as const).map(([key, label]) => <Field key={key} label={`${label} (boş: sınırsız)`}><input className="panel-input" type="number" min={1} value={value[key] ?? ""} onChange={e => setValue({ ...value, [key]: e.target.value ? Number(e.target.value) : null })} /></Field>)}
    <fieldset className="grid gap-3 md:col-span-2"><legend className="mb-3 font-semibold">Etkin modüller</legend><div className="grid gap-3 sm:grid-cols-3">{PACKAGE_MODULES.map(module => <label key={module} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="checkbox" checked={value.modules.includes(module)} onChange={e => setValue({ ...value, modules: e.target.checked ? [...value.modules, module] : value.modules.filter(item => item !== module) })} />{labels[module]}</label>)}</div></fieldset>
    <p className="text-xs text-slate-500 md:col-span-2">Firma yönetimi, temel ayarlar ve güvenli çıkış açık kalır. Modüller rol yetkisini artırmaz; rol ve paket izinlerinin ikisi de gereklidir.</p>
    <button className="panel-button-primary" disabled={action.busy}>Paketi kaydet</button>
  </form>;
}
