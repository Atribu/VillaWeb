import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { SiteIcon } from "@/components/site-templates/site-icon";
import s from "@/components/site-templates/stay-pages.module.css";
import { pickLocalized } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getLocalizedReviewLabel, getLocalizedVilla } from "@/lib/villa-content-i18n";
import {
  formatCurrency,
  VILLA_SUITABILITY_OPTIONS,
} from "@/lib/villa-catalog";
import { VillaAvailabilityCard } from "@/components/villas/villa-availability-card";
import { VillaGallery } from "@/components/villas/villa-gallery";
import { PublicVillaCard } from "@/components/villas/public-villa-card";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import { getDemoVillaBySlug, getDemoVillas } from "@/lib/server/demo-villa-store";

type PageProps = {
  searchParams?: Promise<{ checkIn?: string; checkOut?: string }>;
  params: Promise<{
    slug: string;
  }>;
};

function formatDistance(value: number, unit: "m" | "km", locale: "tr" | "en") {
  return `${new Intl.NumberFormat(locale === "en" ? "en-US" : "tr-TR", {
    maximumFractionDigits: unit === "km" ? 1 : 0,
  }).format(value)} ${unit}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const villa = await getDemoVillaBySlug(slug, { publicSite: true, companyId: company.id, includeMetrics: false, includeInactive: false });

  if (!villa) {
    return {
      title: pickLocalized(locale, "Villa Bulunamadi", "Villa Not Found"),
    };
  }

  const localizedVilla = getLocalizedVilla(villa, locale);

  return {
    title: localizedVilla.seoTitle,
    description: localizedVilla.seoDescription,
    keywords: [
      localizedVilla.focusKeyword,
      localizedVilla.city,
      localizedVilla.district,
      pickLocalized(locale, "villa kiralama", "villa rental"),
    ],
    alternates: {
      canonical: `/villalar/${localizedVilla.slug}`,
    },
    openGraph: {
      title: localizedVilla.seoTitle,
      description: localizedVilla.seoDescription,
      images: localizedVilla.coverImageUrl ? [{ url: localizedVilla.coverImageUrl }] : undefined,
      type: "article",
    },
  };
}

export default async function VillaDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const selectedDates = (await searchParams) ?? {};
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const rawVilla = await getDemoVillaBySlug(slug, { publicSite: true,
    companyId: company.id,
    includeMetrics: false,
    includeInactive: false,
  });

  if (!rawVilla) {
    notFound();
  }

  const villa = getLocalizedVilla(rawVilla, locale);

  const allVillas = await getDemoVillas({ publicSite: true,
    companyId: company.id,
    includeMetrics: false,
    includeInactive: false,
  });
  const relatedVillas = allVillas
    .filter((item) => item.slug !== villa.slug && item.city === villa.city)
    .slice(0, 3);

  const galleryImages =
    villa.imageUrls.length > 0 ? villa.imageUrls : villa.coverImageUrl ? [villa.coverImageUrl] : [];
  const mapSrc =
    typeof villa.latitude === "number" && typeof villa.longitude === "number"
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${villa.longitude - 0.02}%2C${villa.latitude - 0.012}%2C${villa.longitude + 0.02}%2C${villa.latitude + 0.012}&layer=mapnik&marker=${villa.latitude}%2C${villa.longitude}`
      : null;
  const distanceItems = [
    villa.marketDistanceMeters !== undefined
      ? [pickLocalized(locale, "Market", "Market"), formatDistance(villa.marketDistanceMeters, "m", locale)]
      : null,
    villa.beachDistanceMeters !== undefined
      ? [pickLocalized(locale, "Deniz", "Beach"), formatDistance(villa.beachDistanceMeters, "m", locale)]
      : null,
    villa.centerDistanceMeters !== undefined
      ? [pickLocalized(locale, "Merkez", "Town centre"), formatDistance(villa.centerDistanceMeters, "m", locale)]
      : null,
    villa.airportDistanceKm !== undefined
      ? [pickLocalized(locale, "Havalimani", "Airport"), formatDistance(villa.airportDistanceKm, "km", locale)]
      : null,
  ].filter((item): item is [string, string] => item !== null);
  const suitabilityItems = VILLA_SUITABILITY_OPTIONS.filter((item) =>
    villa.suitabilityTags?.includes(item.key),
  );
  const additionalFeeItems = [
    (villa.electricityFee ?? 0) > 0
      ? [pickLocalized(locale, "Elektrik ucreti", "Electricity fee"), formatCurrency(villa.electricityFee ?? 0, locale)]
      : null,
    (villa.waterFee ?? 0) > 0
      ? [pickLocalized(locale, "Su ucreti", "Water fee"), formatCurrency(villa.waterFee ?? 0, locale)]
      : null,
    (villa.extraGuestFee ?? 0) > 0
      ? [pickLocalized(locale, "Ek misafir ucreti", "Extra guest fee"), formatCurrency(villa.extraGuestFee ?? 0, locale)]
      : null,
    (villa.damageDeposit ?? 0) > 0
      ? [pickLocalized(locale, "Hasar depozitosu", "Damage deposit"), formatCurrency(villa.damageDeposit ?? 0, locale)]
      : null,
  ].filter((item): item is [string, string] => item !== null);

  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const href = (path: string) => getDemoCompanySiteHref(company.slug, path);
  const reviewLabel = typeof villa.rating === "number" ? getLocalizedReviewLabel(villa, locale) : null;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "VacationRental",
    name: villa.title, description: villa.seoDescription, image: galleryImages,
    address: { "@type": "PostalAddress", addressLocality: villa.district, addressRegion: villa.city, addressCountry: "TR" },
    numberOfRooms: villa.bedroomCount,
    occupancy: { "@type": "QuantitativeValue", maxValue: villa.capacity },
    amenityFeature: (villa.amenities ?? []).map((item) => ({ "@type": "LocationFeatureSpecification", name: item.label, value: true })),
  };

  return <div className={s.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <nav className={s.breadcrumbs} aria-label={t("Sayfa yolu", "Breadcrumb")}>
      <Link href={href("/")}>{t("Ana sayfa", "Home")}</Link><span>/</span>
      <Link href={href("/villalar")}>{t("Villa koleksiyonu", "Villa collection")}</Link><span>/</span>
      <span aria-current="page">{villa.title}</span>
    </nav>
    <header className={s.headingRow}>
      <div>
        <p className={s.eyebrow}>{villa.locationLabel} / {villa.category}</p>
        <h1 className={s.title}>{villa.title}</h1>
        <div className={s.meta}>
          <span><SiteIcon name="pin" />{villa.locationLabel}</span>
          {reviewLabel && <span>★ {villa.rating?.toFixed(2)} · {reviewLabel}</span>}
          {villa.shortCode && <span>{t("Villa kodu", "Villa code")}: {villa.shortCode}</span>}
          {villa.badge && <span>{villa.badge}</span>}
        </div>
      </div>
      <a href="#availability" className={s.textLink}>{t("Konaklamanı planla", "Plan your stay")}<SiteIcon name="arrow" /></a>
    </header>

    <VillaGallery images={galleryImages} alt={villa.coverAlt} coverGradient={villa.coverGradient} locale={locale} />
    <div className={s.license}>
      <p>{t("Turizm İşletme Belge No", "Tourism Operation License No")}: <strong>{villa.tourismLicenseNumber || "—"}</strong></p>
      {villa.tourismLicensePdfUrl
        ? <a href={villa.tourismLicensePdfUrl} target="_blank" rel="noopener noreferrer">{t("Belge PDF'ini aç", "Open license PDF")} ↗</a>
        : <span>{t("PDF eklenmedi", "No PDF attached")}</span>}
    </div>

    <div className={s.detailGrid}>
      <div className={s.detailContent}>
        <div className={s.quickFacts}>
          <div><SiteIcon name="people" /><strong>{villa.capacity}</strong><span>{t("misafir", "guests")}</span></div>
          <div><SiteIcon name="bed" /><strong>{villa.bedroomCount}</strong><span>{t("yatak odası", "bedrooms")}</span></div>
          <div><SiteIcon name="bath" /><strong>{villa.bathroomCount}</strong><span>{t("banyo", "bathrooms")}</span></div>
          <div><SiteIcon name="home" /><strong>{villa.poolType}</strong><span>{t("havuz deneyimi", "pool experience")}</span></div>
        </div>
        <section className={s.section}>
          <p className={s.eyebrow}>{t("BU EVİN HİKÂYESİ", "THE STORY OF THIS HOME")}</p>
          <h2>{t("Kendi ritminizde bir tatil.", "A holiday at your own pace.")}</h2>
          <p className={s.prose}>{villa.description || villa.shortDescription}</p>
          {suitabilityItems.length > 0 && <div className={s.tags}>{suitabilityItems.map((item) => <span key={item.key}>{t(item.label, item.labelEn)}</span>)}</div>}
        </section>

        {!!villa.amenities?.length && <section className={s.section}>
          <p className={s.eyebrow}>{t("EVİNİZDEKİ AYRICALIKLAR", "MAKE YOURSELF AT HOME")}</p>
          <h2>{t("Küçük detaylar, güzel bir konaklama.", "The details that make a stay.")}</h2>
          <ul className={s.amenities}>{villa.amenities.map((item, index) => <li key={`${item.key}-${index}`}><SiteIcon name="check" />{item.label}</li>)}</ul>
        </section>}

        <section className={s.section}>
          <p className={s.eyebrow}>{t("GELMEDEN ÖNCE", "BEFORE YOU ARRIVE")}</p>
          <h2>{t("Konaklama bilgileri.", "Your stay, at a glance.")}</h2>
          <dl className={s.dataRows}>
            <div><dt>{t("Giriş saati", "Check-in time")}</dt><dd>{villa.checkInTime ?? t("Bilgi alınız", "Please enquire")}</dd></div>
            <div><dt>{t("Çıkış saati", "Check-out time")}</dt><dd>{villa.checkOutTime ?? t("Bilgi alınız", "Please enquire")}</dd></div>
            <div><dt>{t("Minimum konaklama", "Minimum stay")}</dt><dd>{villa.minNightCount ?? 1} {t("gece · döneme göre değişebilir", "nights · may vary by season")}</dd></div>
            <div><dt>{t("Temizlik ücreti", "Cleaning fee")}</dt><dd>{formatCurrency(villa.cleaningFee ?? 0, locale)}</dd></div>
            {additionalFeeItems.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
          {villa.extraFeeNotes && <p className={s.prose}>{villa.extraFeeNotes}</p>}
          {!!villa.houseRules?.length && <>
            <h2 style={{ marginTop: 30 }}>{t("Ev kuralları.", "House rules.")}</h2>
            <ol className={s.rules}>{villa.houseRules.map((rule, index) => <li key={index}>{rule}</li>)}</ol>
          </>}
        </section>

        <section className={s.section}>
          <p className={s.eyebrow}>{t("YAKINLARDA NE VAR?", "IN THE NEIGHBOURHOOD")}</p>
          <h2>{villa.locationLabel}</h2>
          {villa.address && <p className={s.prose}>{villa.address}</p>}
          {distanceItems.length > 0 && <dl className={s.dataRows}>{distanceItems.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
          {mapSrc && <iframe title={t(`${villa.title} haritası`, `${villa.title} map`)} src={mapSrc} loading="lazy" className={s.map} referrerPolicy="no-referrer-when-downgrade" />}
        </section>
      </div>

      <aside className={s.bookingAside} id="availability" aria-label={t("Konaklamanızı planlayın", "Plan your stay")}>
        <div className={s.bookingCard}>
          <div className={s.priceHeader}>
            <p className={s.eyebrow}>{t("SİZE AİT BİR KONAKLAMA", "A STAY OF YOUR OWN")}</p>
            <div>{villa.discountedNightlyPrice ? <del>{formatCurrency(villa.nightlyPrice, locale)}</del> : null}<strong>{formatCurrency(villa.discountedNightlyPrice ?? villa.nightlyPrice, locale)}</strong><small>/ {t("gece", "night")}</small></div>
            <p className={s.note}>{t("Başlangıç fiyatı. Kesin tutar seçtiğiniz tarihlere göre hesaplanır.", "Starting rate. Your stay total is calculated for your selected dates.")}</p>
          </div>
          <VillaAvailabilityCard key={`${selectedDates.checkIn}-${selectedDates.checkOut}`} villa={villa} locale={locale} companySlug={company.slug} initialCheckIn={selectedDates.checkIn} initialCheckOut={selectedDates.checkOut} />
        </div>
        <div className={s.bookingHelp}><SiteIcon name="sun" /><div>{t("Aklınızda bir soru mu var?", "Have a question?")}<Link href={href("/iletisim")}>{t("Tatilinizi birlikte planlayalım.", "Let’s plan your stay together.")}</Link></div></div>
      </aside>
    </div>

    {relatedVillas.length > 0 && <section className={s.related}>
      <div className={s.headingRow}><div><p className={s.eyebrow}>{t("KEŞFETMEYE DEVAM EDİN", "KEEP EXPLORING")}</p><h2 className={s.sectionTitle}>{t("Aynı kıyıda, başka bir hikâye.", "Another story, on the same coast.")}</h2></div><Link href={href("/villalar")} className={s.textLink}>{t("Tüm villalar", "All villas")}<SiteIcon name="arrow" /></Link></div>
      <div className={s.relatedGrid}>{relatedVillas.map((item) => <PublicVillaCard key={item.id} villa={item} compact locale={locale} companySlug={company.slug} />)}</div>
    </section>}
  </div>;
}
