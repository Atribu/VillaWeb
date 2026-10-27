"use client";

import { useState } from "react";
import { SITE_TEMPLATES, resolveSiteTemplate, type SiteTemplateKey } from "@/lib/site-templates";

function TemplateThumbnail({ theme }: { theme: SiteTemplateKey }) {
  const accent = SITE_TEMPLATES.find((item) => item.id === theme)!.color;
  return <svg viewBox="0 0 320 190" aria-hidden="true" className="w-full rounded-[4px] border border-slate-200 bg-white">
    <rect x="16" y="14" width="56" height="5" rx="1" fill={accent} />
    <path d="M175 17h24m12 0h24m12 0h24m12 0h21" stroke="#a6adae" strokeWidth="3" />
    {theme === "kiyi" ? <>
      <rect x="0" y="30" width="320" height="100" fill={accent} />
      <path d="m190 130 35-70 95 30v40" fill="#6b9fb1" /><path d="M0 100q100-40 190 30H0" fill="#517f90" />
      <path d="M22 61h110M22 78h90" stroke="white" strokeWidth="6" />
      <rect x="22" y="117" width="276" height="25" rx="2" fill="white" stroke="#dde4e5" />
    </> : <>
      <rect x={theme === "secki" ? 147 : 164} y="34" width={theme === "secki" ? 157 : 140} height="94" fill={theme === "secki" ? "#c4d8cf" : "#d9e7fc"} />
      <path d="m182 84 45-27 50 27v29h-95z" fill={accent} opacity=".45" /><path d="M184 120h100" stroke="white" strokeWidth="5" />
      <path d="M18 56h90M18 73h72" stroke={accent} strokeWidth={theme === "secki" ? 4 : 7} />
      <path d="M18 93h72m-72 9h65" stroke="#a6adae" strokeWidth="2" />
      <rect x="16" y="136" width="288" height="20" rx="2" fill="#f3f5f6" />
    </>}
    {(theme === "secki" ? [16, 164] : [16, 91, 166, 241]).map((x) => <rect key={x} x={x} y="166" width={theme === "secki" ? 140 : 63} height="22" fill={accent} opacity=".17" />)}
  </svg>;
}

export function SiteTemplatePicker({ websiteId, themeKey, busy, onApply }: {
  websiteId: string;
  themeKey?: string;
  busy: boolean;
  onApply: (theme: SiteTemplateKey) => Promise<void>;
}) {
  const current = resolveSiteTemplate(themeKey);
  const [selected, setSelected] = useState<SiteTemplateKey>(current);
  return <div className="mt-6 border-t border-slate-200 pt-6">
    <fieldset disabled={busy}>
      <legend className="text-lg font-semibold text-slate-900">Site tasarımı</legend>
      <p className="mb-5 mt-2 text-sm leading-6 text-slate-500">İçerikleriniz aynı kalır. Seçim yalnızca bu web sitesinin görünümünü değiştirir.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {SITE_TEMPLATES.map((template) => <div key={template.id} className={`rounded-lg border p-4 transition ${selected === template.id ? "border-slate-800 bg-slate-50 ring-1 ring-slate-800" : "border-slate-200"}`}>
          <label className="block cursor-pointer">
            <TemplateThumbnail theme={template.id} />
            <span className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <input type="radio" name={`template-${websiteId}`} value={template.id} checked={selected === template.id} onChange={() => setSelected(template.id)} />
              {template.name}
              {current === template.id && <span className="ml-auto text-xs font-medium text-emerald-700">Aktif tasarım</span>}
            </span>
            <span className="mt-2 block min-h-12 text-xs leading-6 text-slate-500">{template.description}</span>
          </label>
          <a href={`/tasarim-demolari/${template.id}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs font-semibold text-slate-700 underline underline-offset-4">Örnek tasarımı incele ↗</a>
        </div>)}
      </div>
    </fieldset>
    <div className="mt-5 flex flex-wrap items-center gap-4">
      <button type="button" disabled={busy || selected === current} onClick={() => void onApply(selected)} className="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
        {busy ? "Kaydediliyor…" : "Seçili tasarımı uygula"}
      </button>
      <p className="text-xs text-slate-500">Kaydettikten sonra web sitenizi yenileyerek görebilirsiniz.</p>
    </div>
  </div>;
}
