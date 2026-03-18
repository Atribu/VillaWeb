import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Kullanim Kosullari",
  description: "Site kullanim kosullari ve hukuki cerceve sayfasi.",
};

const sections = [
  "Site kullanim cercevesi",
  "Icerik ve fikri mulkiyet notlari",
  "Talep formu ve iletisim sureci kurallari",
  "Sorumluluk sinirlari ve guncelleme hakki",
];

export default function TermsPage() {
  return (
    <Container className="py-14 sm:py-16">
      <div className="rounded-[2.3rem] border border-black/6 bg-white p-8 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
          Kullanim Kosullari
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
          Kullanim sartlari icin yasal sayfa iskeleti
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-600">
          Bu alan, site kullanimi, talep akisinin hukuki cercevesi ve icerik kullanim kosullari
          icin yasal omurgayi tasir.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {sections.map((item) => (
            <div key={item} className="rounded-[1.4rem] bg-[var(--color-slate-soft)] px-5 py-5 text-sm font-medium text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
