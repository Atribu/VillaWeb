"use client";

import { useState, type FormEvent } from "react";
import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";
import { validSearchStay } from "@/lib/public-search";
import { SiteIcon } from "./site-icon";
import s from "./site-templates.module.css";

export function HomeSearch({ companySlug, locations, locale, today }: { companySlug: string; locations: string[]; locale: AppLocale; today: string }) {
  const [checkIn, setCheckIn] = useState("");
  const [error, setError] = useState("");
  function validate(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    if (!validSearchStay(String(data.get("checkIn") ?? ""), String(data.get("checkOut") ?? ""), today)) {
      event.preventDefault();
      setError(pickLocalized(locale, "Giriş ve çıkış tarihlerini kontrol edin. Çıkış tarihi girişten sonra olmalı.", "Check your dates. Check-out must be after check-in."));
    } else setError("");
  }
  return <form action="/villalar" method="get" id="arama" className={s.search} onSubmit={validate}>
    <input type="hidden" name="company" value={companySlug} />
    <label htmlFor="home-location"><span><SiteIcon name="pin" />{pickLocalized(locale, "Nereye?", "Where to?")}</span><input id="home-location" name="location" list="home-locations" placeholder={pickLocalized(locale, "Tüm bölgeler", "All destinations")} /><datalist id="home-locations">{locations.map((location) => <option key={location} value={location} />)}</datalist></label>
    <label htmlFor="home-checkin"><span>{pickLocalized(locale, "Giriş tarihi", "Check-in")}</span><input id="home-checkin" name="checkIn" type="date" min={today} onChange={(event) => { setCheckIn(event.target.value); setError(""); }} aria-describedby={error ? "home-search-error" : undefined} /></label>
    <label htmlFor="home-checkout"><span>{pickLocalized(locale, "Çıkış tarihi", "Check-out")}</span><input id="home-checkout" name="checkOut" type="date" min={checkIn || today} aria-describedby={error ? "home-search-error" : undefined} onChange={() => setError("")} /></label>
    <label htmlFor="home-guests"><span><SiteIcon name="people" />{pickLocalized(locale, "Misafir", "Guests")}</span><input id="home-guests" type="number" name="guests" min={1} step={1} inputMode="numeric" placeholder={pickLocalized(locale, "Kişi sayısı", "Guests")} /></label>
    <button type="submit"><SiteIcon name="search" />{pickLocalized(locale, "Villa bul", "Find a villa")}</button>
    {error && <p id="home-search-error" className={s.searchError} role="alert">{error}</p>}
  </form>;
}
