"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";
import type { VillaFilters as Filters } from "@/lib/villa-filters";
import { validSearchStay } from "@/lib/public-search";
import { SiteIcon } from "@/components/site-templates/site-icon";
import s from "@/components/site-templates/stay-pages.module.css";

type Option = { value: string; label: string };
export function VillaFilters({ companySlug, filters, locations, pools, categories, today, locale }: {
  companySlug: string; filters: Filters; locations: string[]; pools: Option[]; categories: Option[]; today: string; locale: AppLocale;
}) {
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const [checkIn, setCheckIn] = useState(filters.checkIn);
  const [checkOut, setCheckOut] = useState(filters.checkOut);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeCount = [filters.location, filters.checkIn || filters.checkOut, filters.guests, filters.pool, filters.category, filters.minPrice || filters.maxPrice, filters.sort !== "recommended"].filter(Boolean).length;
  function submit(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const min = String(data.get("minPrice") ?? "");
    const max = String(data.get("maxPrice") ?? "");
    if (!validSearchStay(String(data.get("checkIn") ?? ""), String(data.get("checkOut") ?? ""), today)) {
      event.preventDefault(); setError(t("Giriş ve çıkış tarihlerini birlikte, doğru sırayla seçin.", "Choose both arrival and departure dates in the correct order."));
    } else if (min && max && Number(min) > Number(max)) {
      event.preventDefault(); setError(t("En düşük fiyat, en yüksek fiyattan büyük olamaz.", "Minimum price cannot exceed maximum price."));
    } else setError("");
  }
  return <form action="/villalar" method="get" onSubmit={submit} className={s.filters} aria-label={t("Villa filtreleri", "Villa filters")}>
    <input type="hidden" name="company" value={companySlug} />
    <div className={s.filterHeading}><SiteIcon name="filter" /><h2>{t("Tatilini filtrele", "Refine your stay")}</h2></div>
    <button type="button" className={s.filterToggle} aria-expanded={mobileOpen} aria-controls="villa-filter-fields" onClick={() => setMobileOpen(!mobileOpen)}>
      <SiteIcon name="filter" /><span>{t("Filtreler", "Filters")}{activeCount > 0 ? ` (${activeCount})` : ""}</span><span aria-hidden="true">{mobileOpen ? "−" : "+"}</span>
    </button>
    <div id="villa-filter-fields" className={s.filterFields} data-expanded={mobileOpen}>
    <div className={s.filterMain}>
      <label className={s.field}><span>{t("Nereye gitmek istersiniz?", "Where would you like to go?")}</span><input name="location" list="villa-destinations" defaultValue={filters.location} placeholder={t("Bölge veya villa adı", "Destination or villa name")} /><datalist id="villa-destinations">{locations.map((location) => <option key={location} value={location} />)}</datalist></label>
      <label className={s.field}><span>{t("Giriş tarihi", "Check-in")}</span><input name="checkIn" type="date" min={today} value={checkIn} onChange={(event) => { setCheckIn(event.target.value); if (checkOut && event.target.value >= checkOut) setCheckOut(""); }} /></label>
      <label className={s.field}><span>{t("Çıkış tarihi", "Check-out")}</span><input name="checkOut" type="date" min={checkIn || today} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></label>
      <label className={s.field}><span>{t("Misafir", "Guests")}</span><input name="guests" type="number" min={1} step={1} defaultValue={filters.guests} placeholder={t("Kişi sayısı", "Guests")} /></label>
    </div>
      <div className={s.filterAdvanced}>
        {[{ name: "pool", label: t("Havuz tercihi", "Pool preference"), options: pools }, { name: "category", label: t("Tatil tarzınız", "Your holiday style"), options: categories }].map((group) => <fieldset key={group.name}><legend>{group.label}</legend><div className={s.filterChoices}>{[{value:"",label:t("Tümü", "All")}, ...group.options].map((option) => <label key={option.value}><input type="radio" name={group.name} value={option.value} defaultChecked={filters[group.name as "pool" | "category"] === option.value} /><span>{option.label}</span></label>)}</div></fieldset>)}
        <fieldset><legend>{t("Başlangıç gecelik fiyatı · TL", "Starting nightly rate · TRY")}</legend><div className={s.formGrid}><label className={s.field}><span>{t("En düşük", "Minimum")}</span><input name="minPrice" type="number" min={0} step="0.01" defaultValue={filters.minPrice} placeholder="0" /></label><label className={s.field}><span>{t("En yüksek", "Maximum")}</span><input name="maxPrice" type="number" min={0} step="0.01" defaultValue={filters.maxPrice} placeholder={t("Üst sınır yok", "No limit")} /></label></div></fieldset>
        <label className={s.field}><span>{t("Sıralama", "Sort by")}</span><select name="sort" defaultValue={filters.sort}><option value="recommended">{t("Önerilenler", "Recommended")}</option><option value="price-asc">{t("Fiyat: düşükten yükseğe", "Price: low to high")}</option><option value="price-desc">{t("Fiyat: yüksekten düşüğe", "Price: high to low")}</option><option value="capacity">{t("Kapasite: çoktan aza", "Capacity: high to low")}</option></select></label>
      </div>
      <div className={s.filterFooter}><Link href={`/villalar?${new URLSearchParams({company:companySlug})}`} className={s.textLink}>{t("Tümünü temizle", "Clear all")}</Link><button type="submit" className={s.button}>{t("Seçimleri uygula", "Apply filters")}<SiteIcon name="arrow" /></button></div>
    {error && <p role="alert" className={s.notice} data-tone="error">{error}</p>}
    </div>
  </form>;
}
