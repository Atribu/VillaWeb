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
            className="serene-card p-6"
          >
            <p className="serene-eyebrow">
              {item.title}
            </p>
            <p className="mt-4 font-display text-2xl font-semibold text-[var(--serene-on-surface)]">{item.value}</p>
            <p className="mt-3 text-sm leading-7 text-[var(--serene-on-surface-variant)]">
              {item.key === "phone"
                ? pickLocalized(locale, "Dogrudan cagri merkeziyle baglanti kurmak icin kullanilir.", "Use this to connect directly with the call center.")
                : item.key === "whatsapp"
                  ? pickLocalized(locale, "Hizli mesajlasma ve bilgi paylasimi icin tercih edilir.", "Preferred for quick messaging and information sharing.")
                  : pickLocalized(locale, "Detayli bilgi ve resmi iletisim sureci icin kullanilir.", "Used for detailed information and formal communication.")}
            </p>
          </div>
        ))}
      </div>

      <div className="serene-card mt-10 p-8">
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
              className="rounded-[8px] border border-[var(--serene-outline-variant)]/60 bg-[var(--serene-surface-low)] px-4 py-4 text-sm text-[var(--serene-on-surface-variant)]"
            >
              {field}
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={getDemoCompanySiteHref(company.slug, "/talep")}
            className="serene-button-primary px-5 py-3 text-sm font-semibold"
          >
            {pickLocalized(locale, "Talep Ekranina Git", "Go to Inquiry Page")}
          </Link>
          <Link
            href={getDemoCompanySiteHref(company.slug, "/villalar")}
            className="serene-button-secondary px-5 py-3 text-sm font-semibold"
          >
            {pickLocalized(locale, "Villalari Incele", "Browse Villas")}
          </Link>
        </div>
      </div>
    </Container>
  );
}
