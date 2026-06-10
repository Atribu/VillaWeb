import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PublicPageHero } from "@/components/public/public-page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { pickLocalized } from "@/lib/i18n";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCompanyHeroImage } from "@/lib/public-gallery";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();

  return buildPublicMetadata({
    locale,
    title: { tr: "Hakkimizda", en: "About" },
    description: {
      tr: "VillaVera'nin hizmet anlayisini, operasyon modelini ve neden tercih edildigini anlatan kurumsal sayfa.",
      en: "A corporate page explaining VillaVera's service approach, operating model and why it is preferred.",
    },
    canonical: "/hakkimizda",
  });
}

export default async function AboutPage() {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const heroImage = getCompanyHeroImage(company.slug);
  const valueCards = [
    {
      title: pickLocalized(locale, "Secili portfoy anlayisi", "Curated portfolio approach"),
      text: pickLocalized(
        locale,
        "Her villa vitrinde yer almadan once icerik, fiyat, gorsel kalite ve talep akisina uygunluk acisindan degerlendirilir.",
        "Before any villa appears in the showcase, it is reviewed in terms of content, pricing, visual quality and suitability for the inquiry flow.",
      ),
    },
    {
      title: pickLocalized(locale, "Hizli geri donus sureci", "Fast response process"),
      text: pickLocalized(
        locale,
        "Talep gonderen kullaniciya hizli donus saglayacak panel ve operasyon mantigi ile donusum odakli bir akis kurulur.",
        "A conversion-oriented flow is built with panel and operations logic that enables quick responses to users who submit inquiries.",
      ),
    },
    {
      title: pickLocalized(locale, "Panel destekli yonetim", "Panel-backed management"),
      text: pickLocalized(
        locale,
        "Fiyat, kampanya, kupon ve doluluk takvimi tek panelden yonetilerek vitrine anlik sekilde yansitilir.",
        "Pricing, campaigns, coupons and availability calendars are managed from a single panel and reflected instantly on the public site.",
      ),
    },
  ];
  const processSteps = [
    pickLocalized(locale, "Personel villayi ekler, gorselleri ve SEO alanlarini doldurur.", "Staff adds the villa and completes the images and SEO fields."),
    pickLocalized(locale, "Admin fiyatlari, kampanyalari ve doluluk takvimini yonetir.", "The admin manages pricing, campaigns and the availability calendar."),
    pickLocalized(locale, "Kullanici vitrine girer, villayi inceler, tarihi secer ve talep gonderir.", "The user enters the showcase, reviews the villa, selects dates and sends an inquiry."),
    pickLocalized(locale, "Operasyon ekibi talebi hizli sekilde dogru villaya yonlendirir.", "The operations team routes the inquiry quickly to the correct villa."),
  ];

  return (
    <Container className="py-14 sm:py-16">
      <PublicPageHero
        eyebrow={pickLocalized(locale, "Marka Hikayesi", "Brand Story")}
        title={pickLocalized(
          locale,
          "Kurumsal guven ve modern deneyim ayni cizgide bulusuyor",
          "Corporate trust and modern experience meet on the same line",
        )}
        description={pickLocalized(
          locale,
          "VillaVera; secili villa portfoyu, hizli talep akisi ve panel destekli yonetim mantigiyle sadece guzel gorunen degil, gercekten calisan bir kiralama sistemi kurmak icin tasarlandi.",
          "VillaVera was designed to build a rental system that not only looks good, but truly works with a curated villa portfolio, fast inquiry flow and panel-driven management.",
        )}
        backgroundImage={heroImage}
        actions={[
          {
            href: getDemoCompanySiteHref(company.slug, "/villalar"),
            label: pickLocalized(locale, "Villa koleksiyonunu incele", "Explore the villa collection"),
          },
          {
            href: getDemoCompanySiteHref(company.slug, "/iletisim"),
            label: pickLocalized(locale, "Bize ulas", "Contact us"),
            variant: "secondary",
          },
        ]}
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {valueCards.map((item) => (
          <div
            key={item.title}
            className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <h2 className="text-2xl font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <SectionHeading
            eyebrow={pickLocalized(locale, "Operasyon Akisi", "Operational Flow")}
            title={pickLocalized(
              locale,
              "Sistem panelden vitrine tek bir duzende baglanir",
              "The system connects the panel and showcase in a single structure",
            )}
            description={pickLocalized(
              locale,
              "Bu platform sadece bir tasarim vitrini degil; personel, admin ve public tarafin ayni veri yapisi ustunde birlikte calistigi bir operasyon kurgusudur.",
              "This platform is not just a visual showcase; it is an operational setup where staff, admins and the public site work together on the same data structure.",
            )}
          />
        </div>

        <div className="space-y-4">
          {processSteps.map((step, index) => (
            <div
              key={step}
              className="flex gap-4 rounded-[1.6rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                {index + 1}
              </div>
              <p className="text-sm leading-7 text-slate-600">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-[16px] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <SectionHeading
          eyebrow={pickLocalized(locale, "Kurumsal Not", "Corporate Note")}
          title={pickLocalized(
            locale,
            "Marka dili, destek hizi ve guven hissi bu sayfada gucleniyor",
            "Brand tone, support speed and trust perception grow stronger on this page",
          )}
          description={pickLocalized(
            locale,
            "Hakkimizda sayfasi sadece resmi bir tanitim alani degil; kullanicinin dogru yerden hizmet aldigina ikna oldugu guven katmanidir.",
            "The about page is not only a formal introduction. It is also the layer of trust where users feel convinced they are receiving service from the right place.",
          )}
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={getDemoCompanySiteHref(company.slug, "/villalar")}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {pickLocalized(locale, "Villa Koleksiyonunu Incele", "Explore the Villa Collection")}
          </Link>
          <Link
            href={getDemoCompanySiteHref(company.slug, "/iletisim")}
            className="rounded-full border border-black/8 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            {pickLocalized(locale, "Bize Ulas", "Contact Us")}
          </Link>
        </div>
      </div>
    </Container>
  );
}
