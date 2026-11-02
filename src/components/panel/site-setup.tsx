"use client";
import Link from "next/link";
import { useState } from "react";
import type { SiteContent, PlatformConfig } from "@/lib/platform-features";
import { SITE_TEMPLATES } from "@/lib/site-templates";
import { Field, usePlatformAction } from "./platform-controls";

export function SiteSetup({ companyId, companySlug, content, initialConfig, users, currentDomain }: {
  companyId: string; companySlug: string; content: SiteContent; initialConfig: PlatformConfig; users: number; currentDomain: string;
}) {
  const [draft, setDraft] = useState(content); const [config, setConfig] = useState(initialConfig);
  const [userCount, setUserCount] = useState(users); const [uploading, setUploading] = useState(false);
  const action = usePlatformAction();
  const steps = [
    { title: "Marka", detail: "Logo ve ana sayfa başlığı", done: Boolean(draft.logoUrl && draft.heroTitle) },
    { title: "İletişim", detail: "Telefon, e-posta ve adres", done: Boolean(draft.phone && draft.email && draft.address) },
    { title: "Tasarım", detail: "Site şablonu", done: Boolean(config.siteDraft || config.sitePublished) },
    { title: "Alan adı", detail: "DNS / TLS sunucuda doğrulanır", done: Boolean(draft.domain && currentDomain === draft.domain) },
    { title: "İlk kullanıcı", detail: "Firma yöneticisi hesabı", done: userCount > 0 },
  ];
  const done = steps.filter(step => step.done).length;
  return <div className="work-stack">
    <section className="work-card"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Kurulum kontrol listesi</h2><span>{done} / {steps.length}</span></div>
      <progress aria-label="Kurulum ilerlemesi" max={steps.length} value={done} className="my-4 h-2 w-full accent-emerald-700" />
      <ol className="grid gap-4 md:grid-cols-5">{steps.map((step, index) => <li key={step.title} className="rounded-lg border border-slate-200 p-3"><span className={`text-xs font-semibold ${step.done ? "text-emerald-700" : "text-slate-500"}`}>{step.done ? "Tamamlandı" : `${index + 1}. adım`}</span><p className="mt-2 font-semibold">{step.title}</p><p className="mt-1 text-xs text-slate-500">{step.detail}</p></li>)}</ol>
    </section>
    {action.feedback}
    <form className="work-card grid gap-5 md:grid-cols-2" onSubmit={async event => { event.preventDefault(); const result = await action.run<PlatformConfig>("site", { action: "save", companyId, version: config.version, content: draft }); if (result) { setConfig(result); action.setMessage("Taslak kaydedildi. Ziyaretçiler yayınlanmış sürümü görmeye devam ediyor."); } }}>
      <div className="md:col-span-2"><h2 className="text-lg font-semibold">Site taslağı</h2><p className="mt-1 text-sm text-slate-500">Kaydetmek yayınlamak değildir. Önizlemeden sonra ayrıca yayınlayın.</p></div>
      <Field label="Tasarım şablonu"><select className="panel-input" value={draft.themeKey} onChange={event => setDraft({ ...draft, themeKey: event.target.value as SiteContent["themeKey"] })}>{SITE_TEMPLATES.map(theme => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></Field>
      <Field label="Firma logosu"><input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || action.busy} onChange={async event => {
        const file = event.target.files?.[0]; if (!file) return; setUploading(true);
        try { const body = new FormData(); body.set("companyId", companyId); body.set("logo", file); const response = await fetch("/api/panel/platform/logo", { method: "POST", body }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setDraft(value => ({ ...value, logoUrl: data.url })); action.setMessage("Logo yüklendi. Yayına yansıtmak için taslağı kaydedip yayınlayın."); }
        catch (error) { action.setMessage(error instanceof Error ? error.message : "Logo yüklenemedi."); } finally { setUploading(false); }
      }} />{draft.logoUrl && <a href={draft.logoUrl} target="_blank" rel="noreferrer" className="text-sm underline">Yüklenen logoyu gör</a>}</Field>
      {([ ["heroTitle", "Ana sayfa başlığı"], ["heroDescription", "Ana sayfa açıklaması"], ["heroTitleEn", "Ana başlık (İngilizce)"], ["heroDescriptionEn", "Açıklama (İngilizce)"], ["phone", "Telefon"], ["email", "E-posta"], ["address", "Adres"], ["whatsapp", "WhatsApp"], ["domain", "Talep edilen alan adı"] ] as const).map(([key, label]) => <Field key={key} label={label}><input className="panel-input" value={draft[key] ?? ""} required={key === "heroTitle"} type={key === "email" ? "email" : "text"} onChange={event => setDraft({ ...draft, [key]: event.target.value })} /></Field>)}
      <p className="text-xs leading-6 text-slate-500 md:col-span-2">Alan adını yazmak DNS veya SSL kurulumu yapmaz ve başka firmanın alan adını devralmaz. Sunucu yöneticisi alan adını doğrulayıp Firmalar bölümünde bağlamalıdır. Kayıtlı alan adı: {currentDomain || "Henüz yok"}.</p>
      <div className="flex flex-wrap gap-3 md:col-span-2"><button disabled={action.busy || uploading} className="panel-button-primary">{action.busy ? "Kaydediliyor..." : "Taslağı kaydet"}</button>
        {config.siteDraft && <a className="panel-button-secondary" target="_blank" rel="noreferrer" href={`/?company=${encodeURIComponent(companySlug)}&preview=1`}>Kaydedilen taslağı önizle</a>}
        <button type="button" className="panel-button-secondary" disabled={action.busy || !config.siteDraft} onClick={async () => {
          if (!window.confirm("Kaydedilen taslak ziyaretçilere yayınlansın mı? Formdaki kaydedilmemiş değişiklikler dahil edilmez.")) return;
          const result = await action.run<PlatformConfig>("site", { action: "publish", companyId, version: config.version }); if (result) { setConfig(result); action.setMessage("Kaydedilen taslak yayınlandı."); }
        }}>Kaydedilen taslağı yayınla</button></div>
      <p className="text-xs text-slate-500">Sürüm {config.version} · {config.sitePublished ? "Yayınlanmış içerik var" : "Mevcut site içeriği kullanılıyor"}</p>
    </form>
    {userCount === 0 ? <form className="work-card grid gap-4 md:grid-cols-2" onSubmit={async event => {
      event.preventDefault(); const form = event.currentTarget; const fields = Object.fromEntries(new FormData(form));
      if (await action.run("first-user", { ...fields, companyId })) { setUserCount(1); form.reset(); }
    }}><h2 className="text-lg font-semibold md:col-span-2">İlk firma yöneticisi</h2>
      {[["fullName", "Ad soyad"], ["username", "Kullanıcı adı"], ["email", "E-posta"], ["phone", "Telefon"], ["password", "Geçici şifre (en az 12 karakter)"]].map(([name, label]) => <Field key={name} label={label}><input className="panel-input" name={name} type={name === "password" ? "password" : name === "email" ? "email" : "text"} required minLength={name === "password" ? 12 : 1} autoComplete={name === "password" ? "new-password" : "off"} /></Field>)}<button disabled={action.busy} className="panel-button-primary">Yönetici oluştur</button></form> : <p className="text-sm text-slate-600">{userCount} kullanıcı tanımlı. <Link className="underline" href="/panel/personel">Kullanıcıları yönet</Link></p>}
  </div>;
}
