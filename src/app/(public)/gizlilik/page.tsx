import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { pickLocalized } from "@/lib/i18n";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCurrentLocale } from "@/lib/server/app-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();

  return buildPublicMetadata({
    locale,
    title: { tr: "Gizlilik Politikasi", en: "Privacy Policy" },
    description: {
      tr: "Cerezler, veri kullanimi ve talep akisina dair gizlilik politikasi sayfasi.",
      en: "A privacy policy page covering cookies, data usage and the inquiry flow.",
    },
    canonical: "/gizlilik",
  });
}

const sections = [
  "Toplanan veriler ve kullanildigi alanlar",
  "Cerez ve oturum yonetimi",
  "Iletisim formlari ve talep kayitlari",
  "Uygulanacak saklama ve imha surecleri",
];

export default async function PrivacyPage() {
  const locale = await getCurrentLocale();

  return (
    <Container className="py-14 sm:py-16">
      <div className="rounded-[2.3rem] border border-black/6 bg-white p-8 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
          {pickLocalized(locale, "Gizlilik Politikasi", "Privacy Policy")}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
          {pickLocalized(locale, "Gizlilik ve veri kullanimi icin yasal sayfa iskeleti", "Legal page framework for privacy and data usage")}
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-600">
          {pickLocalized(
            locale,
            "Bu alan talep formlari, cerezler, oturum yonetimi ve kullanici verilerinin hangi amaclarla islendigi konusunda ziyaretciyi bilgilendiren yasal omurgayi tasir.",
            "This section provides the legal structure that informs visitors about inquiry forms, cookies, session management and the purposes for which user data is processed.",
          )}
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {sections.map((item) => (
            <div key={item} className="rounded-[1.4rem] bg-[var(--color-slate-soft)] px-5 py-5 text-sm font-medium text-slate-700">
              {pickLocalized(
                locale,
                item,
                item === "Toplanan veriler ve kullanildigi alanlar"
                  ? "Collected data and usage areas"
                  : item === "Cerez ve oturum yonetimi"
                    ? "Cookie and session management"
                    : item === "Iletisim formlari ve talep kayitlari"
                      ? "Contact forms and inquiry records"
                      : "Retention and deletion processes",
              )}
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
