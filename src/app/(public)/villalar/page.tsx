import type { Metadata } from "next";
import Link from "next/link";
import { PublicVillaCard } from "@/components/villas/public-villa-card";
import { VillaFilters } from "@/components/public/villa-filters";
import { SiteIcon } from "@/components/site-templates/site-icon";
import s from "@/components/site-templates/stay-pages.module.css";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { pickLocalized } from "@/lib/i18n";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import { getDemoVillas } from "@/lib/server/demo-villa-store";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";
import { getLocalizedVilla } from "@/lib/villa-content-i18n";
import { isDateKey } from "@/lib/booking-dates";
import { filterVillas, readVillaFilters, villaFilterHref, type VillaFilters as Filters } from "@/lib/villa-filters";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();

  return buildPublicMetadata({
    locale,
    title: { tr: "Villalar", en: "Villas" },
    description: {
      tr: "Lokasyon, kategori ve tatil tipine gore kesfedilebilen villa koleksiyonunu inceleyin.",
      en: "Explore the villa collection by destination, category and holiday style.",
    },
    keywords: {
      tr: ["villa kiralama", "kalkan villa", "fethiye villa", "bodrum villa", "ozel havuzlu villa"],
      en: ["villa rental", "kalkan villa", "fethiye villa", "bodrum villa", "private pool villa"],
    },
    canonical: "/villalar",
  });
}


export const dynamic = "force-dynamic";

export default async function VillasPage({ searchParams }: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const filters = readVillaFilters((await searchParams) ?? {});
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  const catalog = await getDemoVillas({ publicSite: true, companyId: company.id, includeMetrics: false, includeInactive: false });
  const { villas, invalidDates, invalidBudget } = filterVillas(catalog, filters, today);
  const locations = Array.from(new Set(catalog.flatMap((villa) => [villa.city, villa.district]).filter(Boolean))).sort();
  function options(key: "poolType" | "category") {
    return Array.from(new Map(catalog.filter((villa) => villa[key]).map((villa) =>
      [villa[key], { value: villa[key], label: getLocalizedVilla(villa, locale)[key] }]
    )).values());
  }
  const pools = options("poolType");
  const categories = options("category");
  const chips: { label: string; remove: (keyof Filters)[] }[] = [];
  if (filters.location) chips.push({ label: filters.location, remove: ["location"] });
  if (filters.guests) chips.push({ label: `${filters.guests}+ ${t("misafir", "guests")}`, remove: ["guests"] });
  if (filters.checkIn || filters.checkOut) chips.push({
    label: [filters.checkIn, filters.checkOut].map((date) => isDateKey(date) ? formatShortDate(date, locale) : date || t("Tarih seçin", "Choose date")).join(" / "),
    remove: ["checkIn", "checkOut"],
  });
  if (filters.pool) chips.push({ label: pools.find((option) => option.value === filters.pool)?.label ?? filters.pool, remove: ["pool"] });
  if (filters.category) chips.push({ label: categories.find((option) => option.value === filters.category)?.label ?? filters.category, remove: ["category"] });
  if (filters.minPrice || filters.maxPrice) chips.push({
    label: `${formatCurrency(Number(filters.minPrice || 0), locale)} / ${filters.maxPrice ? formatCurrency(Number(filters.maxPrice), locale) : t("Üst sınır yok", "No limit")}`,
    remove: ["minPrice", "maxPrice"],
  });
  const clearHref = getDemoCompanySiteHref(company.slug, "/villalar");
  const villaListJsonLd = {
    "@context": "https://schema.org", "@type": "ItemList",
    name: `${company.shortName} ${t("Villa Koleksiyonu", "Villa Collection")}`,
    itemListElement: villas.map((villa, index) => ({
      "@type": "ListItem", position: index + 1, name: getLocalizedVilla(villa, locale).title,
      url: getDemoCompanySiteHref(company.slug, `/villalar/${villa.slug}`),
    })),
  };
  return <div className={s.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(villaListJsonLd).replace(/</g, "\\u003c") }} />
    <nav className={s.breadcrumbs} aria-label={t("Sayfa yolu", "Breadcrumb")}><Link href={getDemoCompanySiteHref(company.slug, "/")}>{t("Ana sayfa", "Home")}</Link><span>/</span><span>{t("Villalar", "Villas")}</span></nav>
    <header className={s.headingRow}>
      <div><p className={s.eyebrow}>{t("SİZE AİT BİR YER", "A PLACE OF YOUR OWN")}</p><h1 className={s.title}>{t("Bir sonraki güzel anınız.", "Your next beautiful moment.")}</h1><p className={s.intro}>{t("Konumu siz seçin. Geriye yalnızca size iyi gelen bir villayı bulmak kalsın.", "Choose your destination. Then find a villa that feels just right for you.")}</p></div>
      <Link href={getDemoCompanySiteHref(company.slug, "/iletisim")} className={s.textLink}>{t("Birlikte seçelim", "Let us help you choose")}<SiteIcon name="arrow" /></Link>
    </header>
    <div className={s.listingLayout}>
      <aside className={s.filterSidebar} aria-label={t("Villa filtreleri", "Villa filters")}>
        <VillaFilters key={JSON.stringify(filters)} companySlug={company.slug} filters={filters} locations={locations} pools={pools} categories={categories} today={today} locale={locale} />
      </aside>
      <section className={s.listingResults} aria-label={t("Villa sonuçları", "Villa results")}>
    {chips.length > 0 && <div className={s.filterChips} aria-label={t("Seçili filtreler", "Selected filters")}>{chips.map((chip) => <Link key={chip.remove.join("-")} href={villaFilterHref(company.slug, filters, chip.remove)} aria-label={`${chip.label} · ${t("Filtreyi kaldır", "Remove filter")}`}>{chip.label}<span aria-hidden="true">×</span></Link>)}<Link href={clearHref}>{t("Tümünü temizle", "Clear all")}</Link></div>}
    {(invalidDates || invalidBudget) && <p role="alert" className={s.notice} data-tone="error">{invalidDates ? t("Bugünden sonraki giriş ve çıkış tarihlerini birlikte, doğru sırayla seçin.", "Choose arrival and departure dates from today onwards in the correct order.") : t("En düşük fiyat, en yüksek fiyattan büyük olamaz.", "Minimum price cannot exceed maximum price.")}</p>}
    <div className={s.resultsBar}><p><strong>{villas.length}</strong> {t("villa sizi bekliyor", "villas await you")}</p><span>{filters.checkIn && !invalidDates ? t("Seçtiğiniz tarihlerde müsait villalar", "Available for your selected dates") : t("Fiyatlar gecelik başlangıç fiyatıdır.", "Prices shown are starting nightly rates.")}</span></div>
    {villas.length ? <div className={s.listingGrid}>{villas.map((villa) => <PublicVillaCard key={villa.id} villa={villa} locale={locale} companySlug={company.slug} stay={!invalidDates && filters.checkIn ? { checkIn: filters.checkIn, checkOut: filters.checkOut } : undefined} />)}</div>
      : <section className={s.empty}><SiteIcon name="search" /><h2>{t("Bu seçimlerle bir villa bulamadık.", "No villas match these choices.")}</h2><p>{t("Tarihleri veya filtreleri değiştirerek yeniden deneyebilirsiniz.", "Try different dates or adjust your filters.")}</p><Link href={clearHref} className={s.button}>{t("Tüm villaları keşfet", "Explore all villas")}</Link></section>}
      </section>
    </div>
    <footer className={s.listingFooter}><div><p className={s.eyebrow}>{t("BİRLİKTE PLANLAYALIM", "LET'S PLAN TOGETHER")}</p><h2>{t("Aklınızda başka bir tatil mi var?", "Something else in mind?")}</h2><p>{t("Nasıl bir yer aradığınızı anlatın, size uygun seçenekleri birlikte bulalım.", "Tell us what you have in mind. We will help you find the right place.")}</p></div><Link href={getDemoCompanySiteHref(company.slug, "/iletisim")} className={s.button}>{t("Bizimle konuşun", "Talk to us")}<SiteIcon name="arrow" /></Link></footer>
  </div>;
}
