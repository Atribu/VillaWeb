import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { blogPreview } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Bolge rehberleri, villa secim ipuclari ve organik buyume odakli tatil icerikleri.",
};

export default function BlogPage() {
  return (
    <Container className="py-14 sm:py-16">
      <div className="rounded-[2.3rem] border border-black/6 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-8">
        <SectionHeading
          eyebrow="Blog ve Rehber"
          title="Organik trafik ureten, guven ve karar kalitesini artiran icerik merkezi"
          description="Blog modulu; bolge rehberleri, tatil planlama icerikleri ve villa secim tavsiyeleriyle sitenin SEO omurgasini besleyen ana alanlardan biridir."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.8rem] bg-slate-900 p-8 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-200">
              Icerik Stratejisi
            </p>
            <p className="mt-4 text-3xl font-semibold leading-tight">
              Bolge, kategori ve niyet bazli iceriklerle reklam olmadan gorunurluk kazaniriz.
            </p>
            <p className="mt-5 text-sm leading-8 text-slate-300">
              Blog sadece okunacak bir alan degil; villa detay sayfalarina, bolge sayfalarina ve
              kampanya sayfalarina trafik tasiyan bir icerik merkezi olarak kurgulanir.
            </p>
          </div>

          <div className="rounded-[1.8rem] bg-[var(--color-coral-soft)] p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
              Hedef
            </p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              Arama niyeti yuksek kullaniciyi once icerikle yakalayıp sonra villa detayina
              yonlendirmek.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {blogPreview.map((post) => (
          <article
            key={post.title}
            className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
              {post.category}
            </p>
            <h2 className="mt-4 text-2xl font-semibold leading-tight text-slate-900">{post.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Arama motorlarindan trafik cekecek, detay sayfalarina ic link verecek ve kullaniciyi
              karar asamasina tasiyacak uzun formlu rehber icerik iskeleti.
            </p>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <SectionHeading
          eyebrow="Editoryal Omurga"
          title="Her yazı bir sonraki sayfaya trafik tasiyacak sekilde planlanir"
          description="Blog icerikleri; bolge sayfalari, villa detaylari ve kampanya sayfalariyla birbirine baglanarak sitede guclu bir ic link yapisi kurar."
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {[
            "Bolge rehberleri",
            "Villa secim kilavuzlari",
            "Mevsimsel tatil icerikleri",
          ].map((item) => (
            <div key={item} className="rounded-[1.3rem] bg-[var(--color-slate-soft)] px-5 py-5 text-sm font-semibold text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
