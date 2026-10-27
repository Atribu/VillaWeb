import Link from "next/link";
import { formatCurrency, type CatalogVilla } from "@/lib/villa-catalog";
import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";
import { getLocalizedVilla } from "@/lib/villa-content-i18n";
import { SiteIcon } from "@/components/site-templates/site-icon";
import s from "@/components/site-templates/site-templates.module.css";

export function PublicVillaCard({ villa, compact = false, locale = "tr", companySlug, stay }: { villa: CatalogVilla; compact?: boolean; locale?: AppLocale; companySlug?: string; stay?: { checkIn: string; checkOut: string } }) {
  const item = getLocalizedVilla(villa, locale);
  const query = new URLSearchParams({ ...(companySlug ? { company: companySlug } : {}), ...stay });
  const href = `/villalar/${item.slug}${query.size ? `?${query}` : ""}`;
  const price = item.discountedNightlyPrice ?? item.nightlyPrice;
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  return <article className={s.villaCard}>
    <Link href={href}>
      <div className={s.cardMedia}>
        {item.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.coverImageUrl} alt={item.coverAlt || item.title} loading="lazy" />
        ) : <div className={s.cardPlaceholder}><SiteIcon name="home" /></div>}
        {(item.badge || item.featured) && <span className={s.cardBadge}>{item.badge || t("Öne çıkan", "Featured")}</span>}
      </div>
      <div className={s.cardBody}>
        <p className={s.cardLocation}>{item.locationLabel}{item.shortCode ? ` / ${item.shortCode}` : ""}</p>
        <div className={s.cardTitle}><h3>{item.title}</h3><SiteIcon name="arrow" /></div>
        <div className={s.cardAmenities}><span><SiteIcon name="people" />{item.capacity} {t("misafir", "guests")}</span><span><SiteIcon name="bed" />{item.bedroomCount} {t("yatak odası", "bedrooms")}</span>{!compact && <span>{item.poolType}</span>}</div>
        <div className={s.cardPrice}><div>{price < item.nightlyPrice && <del>{formatCurrency(item.nightlyPrice, locale)}</del>}<strong>{formatCurrency(price, locale)}</strong> / {t("gece", "night")}<small>{t("Başlangıç fiyatı · Tarihe göre değişir", "From · Varies by travel dates")}</small></div><span className={s.cardCta}>{t("Villayı incele", "View villa")}</span></div>
      </div>
    </Link>
  </article>;
}
