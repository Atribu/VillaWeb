import Link from "next/link";
import type { DemoCompanyRecord } from "@/lib/demo-companies";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";
import type { SiteTemplateKey } from "@/lib/site-templates";
import type { CatalogVilla } from "@/lib/villa-catalog";
import { PublicVillaCard } from "@/components/villas/public-villa-card";
import { HomeSearch } from "./home-search";
import { SiteIcon } from "./site-icon";
import s from "./site-templates.module.css";

function Photo({ src, alt, priority = false }: { src?: string; alt: string; priority?: boolean }) {
  if (!src) return <div className={s.heroPlaceholder}><SiteIcon name="home" /></div>;
  // Uploads are already WebP; avoid re-encoding large galleries on the server.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={s.photo} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} />;
}

export function TemplateHome({ company, villas, theme, locale }: { company: DemoCompanyRecord; villas: CatalogVilla[]; theme: SiteTemplateKey; locale: AppLocale }) {
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const href = (path: string) => getDemoCompanySiteHref(company.slug, path);
  const showcase = [...villas].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 8);
  const heroVilla = villas.find((villa) => villa.coverImageUrl);
  const secondaryVilla = villas.find((villa) => villa.coverImageUrl && villa.coverImageUrl !== heroVilla?.coverImageUrl) ?? heroVilla;
  const grouped = new Map<string, CatalogVilla[]>();
  for (const villa of villas) {
    const location = villa.district || villa.city;
    if (location) grouped.set(location, [...(grouped.get(location) ?? []), villa]);
  }
  const destinations = Array.from(grouped.entries()).slice(0, 4);
  const locations = Array.from(new Set(villas.flatMap((villa) => [villa.city, villa.district]).filter(Boolean)));
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const faqItems = [
    { question: t("Tarihlerime uygun villaları nasıl bulabilirim?", "How do I find a villa for my dates?"), answer: t("Konum, giriş-çıkış tarihi ve misafir sayısını seçerek arama yapabilirsiniz. Villa detayındaki takvimden uygun günleri inceleyip konaklamanız için talep oluşturabilirsiniz.", "Search by destination, check-in and check-out dates, and guest count. Use the calendar on the villa page to check available dates and send an inquiry.") },
    { question: t("Talep oluşturunca rezervasyonum kesinleşir mi?", "Does an inquiry confirm my reservation?"), answer: t("Talep oluşturmak tek başına kesin rezervasyon değildir. Ekibimiz tarihleri ve detayları kontrol ederek sizinle iletişime geçer. Onay ve ödeme koşulları size iletilen teklif üzerinden netleşir.", "An inquiry is not a confirmed reservation. Our team checks your dates and details and contacts you. Confirmation and payment terms are explained in your offer.") },
    { question: t("Konaklamanın toplam fiyatını nerede görebilirim?", "Where can I see the total price?"), answer: t("Villa detayında tarihlerinizi seçtiğinizde konaklama tutarını ve varsa ek ücretleri inceleyebilirsiniz. Fiyatlar tarih, gece sayısı ve geçerli kampanyalara göre değişebilir.", "Choose your dates on the villa page to view the stay price and any additional fees. Prices may vary by dates, length of stay and available offers.") },
  ];
  const listing = <section className={s.section} id="koleksiyon">
    <div className={s.sectionHeading}><div><p className={s.eyebrow}>{t("SİZİN İÇİN SEÇTİK", "THE VILLA COLLECTION")}</p><h2>{theme === "secki" ? <>{t("Sıradan olmayan", "Extraordinary")}<br /><em>{t("adresler.", "places.")}</em></> : theme === "kiyi" ? <>{t("İyi hissettiren", "Places that feel")} <em>{t("evler.", "like home.")}</em></> : t("Sıradaki güzel anınız burada.", "Your next beautiful moment starts here.")}</h2></div><Link className={s.textLink} href={href("/villalar")}>{t("Tüm koleksiyonu gör", "Explore the collection")}<SiteIcon name="arrow" /></Link></div>
    {showcase.length ? <div className={s.villaGrid}>{showcase.map((villa) => <PublicVillaCard key={villa.id} villa={villa} locale={locale} companySlug={company.slug} />)}</div> : <div className={s.empty}>{t("Yeni villa koleksiyonumuz hazırlanıyor. Tatil planınız için bizimle iletişime geçebilirsiniz.", "Our new villa collection is on its way. Contact us to plan your stay.")}<br /><Link className={s.textLink} href={href("/iletisim")}>{t("Bize ulaşın", "Contact us")}<SiteIcon name="arrow" /></Link></div>}
  </section>;
  const destinationSection = destinations.length > 0 && <section className={s.section} id="bolgeler">
    <div className={s.sectionHeading}><div><p className={s.eyebrow}>{t("BİR YER DEĞİL, BİR HİS", "MORE THAN A DESTINATION")}</p><h2>{t("Her kıyının", "Every coast has")}<br /><em>{t("bir hikâyesi var.", "a story.")}</em></h2></div><p>{t("Birbirinden farklı rotalar. Hepsinde size ait bir tatil.", "Different places. The same feeling of a holiday that is yours.")}</p></div>
    <div className={s.destinations}>{destinations.map(([location, items]) => <Link key={location} href={`/villalar?${new URLSearchParams({ company: company.slug, location })}`} className={s.destination}>
      <Photo src={items.find((villa) => villa.coverImageUrl)?.coverImageUrl} alt={t(`${location} villa koleksiyonu`, `${location} villa collection`)} />
      <div className={s.destinationCaption}><div><h3>{location}</h3><p>{items.length} {t("villa keşfedin", "villas to explore")}</p></div><SiteIcon name="arrow" /></div>
    </Link>)}</div>
  </section>;
  const heroAlt = heroVilla?.coverAlt || t("Villa koleksiyonumuzdan bir görünüm", "A view from our villa collection");
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) }).replace(/</g, "\\u003c") }} />
    {theme === "secki" && <section className={`${s.hero} ${s.seckiHero}`}>
      <div className={s.heroContent}><p className={s.eyebrow}>{company.shortName} / {t("ÖZEL VİLLA SEÇKİSİ", "PRIVATE COLLECTION")}</p><h1>{t("Olağanın", "Beyond the")}<br /><em>{t("dışında.", "ordinary.")}</em></h1><p>{t("Bir evden fazlasını arayanlara. Mimarisi, doğası ve hissiyle ayrışan özel bir villa seçkisi.", "For those looking for more than a place to stay. A villa collection defined by architecture, nature and a sense of belonging.")}</p><a className={s.textLink} href="#koleksiyon">{t("Seçkiyi incele", "Explore the collection")}<SiteIcon name="arrow" /></a><div className={s.edition}><span>{t("SİZE AİT BİR TATİL", "A STAY OF YOUR OWN")}</span><span>{t("VİLLA KOLEKSİYONU", "VILLA COLLECTION")}</span></div></div>
      <div className={s.heroPhoto}><Photo src={heroVilla?.coverImageUrl} alt={heroAlt} priority /><span className={s.verticalLabel}>{t("BAŞKA TÜRLÜ BİR KONAKLAMA", "A DIFFERENT KIND OF STAY")}</span><div className={s.photoCaption}><strong>{t("Doğayla aynı ritimde.", "In rhythm with nature.")}</strong><span>{heroVilla?.locationLabel}</span></div></div>
    </section>}
    {theme === "kiyi" && <section className={`${s.hero} ${s.kiyiHero}`}><Photo src={heroVilla?.coverImageUrl} alt={heroAlt} priority /><div className={s.heroShade} /><div className={s.heroContent}><p className={s.eyebrow}>{t("KENDİNİZE AYIRDIĞINIZ BİR TATİL", "TIME SET ASIDE FOR YOU")}</p><h1>{t("Biraz uzaklaş.", "A little further away.")}<br /><em>{t("Kendine yaklaş.", "A little closer to you.")}</em></h1><p>{t("Kapısını yalnızca sizin açtığınız evler. Sevdiklerinizle, kendi ritminizde bir tatil.", "A home that is yours to unlock. A holiday with the people you love, at your own pace.")}</p><a href="#koleksiyon" className={s.textLink}>{t("Koleksiyonu keşfet", "Explore the collection")}<SiteIcon name="arrow" /></a></div><div className={s.photoCaption}><strong>{heroVilla?.locationLabel}</strong></div></section>}
    {theme === "rota" && <section className={`${s.hero} ${s.rotaHero}`}><div className={s.heroContent}><p className={s.eyebrow}>{t("DAHA AZ PLAN, DAHA ÇOK TATİL", "LESS PLANNING, MORE HOLIDAY")}</p><h1>{t("Tatilin bir", "Your holiday,")}<br /><em>{t("adresi var.", "your place.")}</em></h1><p>{t("Size özel alanlar, birlikte güzel anılar. Kendinize göre bir villa bulun, gerisini hayal edin.", "Your own space, your favourite people. Find the right villa and picture the moments ahead.")}</p><a className={s.textLink} href="#arama">{t("Tatilimi planla", "Plan my holiday")}<SiteIcon name="arrow" /></a></div><div className={s.rotaPhotos}><div className={s.heroPhoto}><Photo src={heroVilla?.coverImageUrl} alt={heroAlt} priority /></div><div className={s.smallPhoto}><Photo src={secondaryVilla?.coverImageUrl} alt={secondaryVilla?.coverAlt ?? heroAlt} /></div><span className={s.photoSticker}><SiteIcon name="sun" />{t("Güzel günler yakında.", "Good days ahead.")}</span></div></section>}
    <div className={s.searchSection}><p className={s.searchIntro}>{t("Tatilinizin", "Make room")}<strong>{t("çerçevesini çizin.", "for your holiday.")}</strong></p><HomeSearch companySlug={company.slug} locations={locations} locale={locale} today={today} /></div>
    <div className={s.promiseStrip}><span><SiteIcon name="home" />{t("Otel odası değil, kendi eviniz.", "Not a hotel room. Your own home.")}</span><span><SiteIcon name="sun" />{t("Kendi ritminizde bir tatil.", "A holiday at your own pace.")}</span><span><SiteIcon name="people" />{t("Sevdiklerinizle, bir arada.", "Together with your favourite people.")}</span></div>
    {theme === "kiyi" ? <>{destinationSection}{listing}</> : <>{listing}{destinationSection}</>}
    <section className={s.story}><div className={s.storyPhoto}><Photo src={secondaryVilla?.imageUrls[1] ?? secondaryVilla?.coverImageUrl} alt={t("Villa tatilinden bir yaşam alanı", "A space to enjoy on your villa holiday")} /></div><div className={s.storyContent}><p className={s.eyebrow}>{t("TATİLİN EN GÜZEL HALİ, SİZİN HALİNİZ.", "THE BEST HOLIDAY IS YOUR KIND OF HOLIDAY.")}</p><h2>{t("Hiçbir yere", "Nowhere else")}<br /><em>{t("yetişmek zorunda değil.", "you need to be.")}</em></h2><p>{t("İster uzun bir aile sofrası, ister iki kişilik sessiz bir sabah. Tatilinizi bir programa değil, kendinize göre yaşayın.", "A long family lunch or a quiet morning for two. Let your holiday follow your rhythm, not a schedule.")}</p><Link href={href("/iletisim")} className={s.textLink}>{t("Birlikte planlayalım", "Let’s plan your stay")}<SiteIcon name="arrow" /></Link></div></section>
    <section className={`${s.section} ${s.faq}`}><div><p className={s.eyebrow}>{t("AKLINIZDA KALMASIN", "GOOD TO KNOW")}</p><h2>{t("Küçük sorular.", "A few questions.")}<br /><em>{t("Net cevaplar.", "Clear answers.")}</em></h2></div><div>{faqItems.map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></section>
  </>;
}
