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
    title: { tr: "Iletisim", en: "Contact" },
    description: {
      tr: "Telefon, e-posta, WhatsApp ve destek akisi ile VillaVera ekibine hizli sekilde ulasin.",
      en: "Reach the VillaVera team quickly through phone, email, WhatsApp and the support flow.",
    },
    canonical: "/iletisim",
  });
}

export default async function ContactPage() {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const heroImage = getCompanyHeroImage(company.slug);
  const contactBlocks = [
    { key: "phone", title: pickLocalized(locale, "Telefon", "Phone"), value: company.phone },
    { key: "email", title: pickLocalized(locale, "E-posta", "Email"), value: company.email },
    { key: "whatsapp", title: "WhatsApp", value: company.whatsapp },
  ];

  return (
    <Container className="py-14 sm:py-16">
      <PublicPageHero
        eyebrow={pickLocalized(locale, "Iletisim", "Contact")}
        title={pickLocalized(
          locale,
          "Kullanici talebini dogru ekibe, hizli sekilde yonlendiren iletisim alani",
          "A contact space that routes user inquiries to the right team quickly",
        )}
        description={pickLocalized(
          locale,
          "Telefon, WhatsApp ve e-posta bilgileriyle iletisim kolaylastirilir; destek yapisi kullaniciyi bir sonraki dogru aksiyona yonlendirir.",
          "Phone, WhatsApp and email make contact easy, while the support structure guides users to the next right action.",
        )}
        backgroundImage={heroImage}
        actions={[
          { href: getDemoCompanySiteHref(company.slug, "/talep"), label: pickLocalized(locale, "Talep ekranina git", "Go to inquiry page") },
          { href: getDemoCompanySiteHref(company.slug, "/villalar"), label: pickLocalized(locale, "Villalari incele", "Browse villas"), variant: "secondary" },
        ]}
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {contactBlocks.map((item) => (
          <div
            key={item.key}
            className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
              {item.title}
            </p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">{item.value}</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {item.key === "phone"
                ? pickLocalized(locale, "Dogrudan cagri merkeziyle baglanti kurmak icin kullanilir.", "Use this to connect directly with the call center.")
                : item.key === "whatsapp"
                  ? pickLocalized(locale, "Hizli mesajlasma ve bilgi paylasimi icin tercih edilir.", "Preferred for quick messaging and information sharing.")
                  : pickLocalized(locale, "Detayli bilgi ve resmi iletisim sureci icin kullanilir.", "Used for detailed information and formal communication.")}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-[16px] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <SectionHeading
          eyebrow={pickLocalized(locale, "Iletisim Formu Yapisi", "Contact Form Structure")}
          title={pickLocalized(
            locale,
            "Talep oncesi veya talep sonrasi destek icin form alani da bu kurguya uyumlu olacak",
            "The support form before or after an inquiry will follow the same structure",
          )}
          description={pickLocalized(
            locale,
            "Kisa, net ve donusum odakli bir form; kullanicidan sadece gerekli bilgileri alip dogru aksiyona yonlendirecek sekilde tasarlanir.",
            "A short, clear and conversion-focused form designed to collect only the necessary information and move users toward the right action.",
          )}
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            pickLocalized(locale, "Ad Soyad", "Full Name"),
            pickLocalized(locale, "Telefon", "Phone"),
            pickLocalized(locale, "E-posta", "Email"),
            pickLocalized(locale, "Mesajiniz", "Your Message"),
          ].map((field) => (
            <div
              key={field}
              className="rounded-[1.3rem] border border-black/6 bg-[var(--color-slate-soft)] px-4 py-4 text-sm text-slate-500"
            >
              {field}
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={getDemoCompanySiteHref(company.slug, "/talep")}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {pickLocalized(locale, "Talep Ekranina Git", "Go to Inquiry Page")}
          </Link>
          <Link
            href={getDemoCompanySiteHref(company.slug, "/villalar")}
            className="rounded-full border border-black/8 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            {pickLocalized(locale, "Villalari Incele", "Browse Villas")}
          </Link>
        </div>
      </div>
    </Container>
  );
}
