import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { faqItems } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "SSS",
  description:
    "Villa kiralama sureci, kampanyalar ve talep yonetimi hakkinda sik sorulan sorular.",
};

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <Container className="py-14 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="rounded-[2.3rem] border border-black/6 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-8">
        <SectionHeading
          eyebrow="Sik Sorulan Sorular"
          title="Donusumu artiran ve SEO'yu destekleyen guven merkezi"
          description="Bu sayfa kullanicinin aklindaki kritik sorulari hizli sekilde cevaplar. Aynı zamanda yapilandirilmis veriyle arama motorlarina da guclu sinyal gonderir."
        />
      </div>

      <div className="mt-10 space-y-4">
        {faqItems.map((item) => (
          <article
            key={item.question}
            className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <h2 className="text-xl font-semibold text-slate-900">{item.question}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <SectionHeading
          eyebrow="SSS ve SEO"
          title="Bu alan sadece bilgilendirme degil, organik gorunurluk icin de kritik"
          description="Kullanici niyeti yuksek sorularin duzenli sekilde yanitlanmasi; hem destek yuku azaltir hem de sayfalarin arama sonuclarinda daha anlamli gorunmesini saglar."
        />
      </div>
    </Container>
  );
}
