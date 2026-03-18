import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { campaignCards } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Kampanyalar",
  description:
    "Secili villalara uygulanan zaman bazli indirimleri, kampanyalari ve kupon kurgularini inceleyin.",
};

export default function CampaignsPage() {
  return (
    <Container className="py-14 sm:py-16">
      <div className="rounded-[2.3rem] border border-black/6 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-8">
        <SectionHeading
          eyebrow="Aktif Kampanyalar"
          title="Eski fiyat, yeni fiyat ve kampanya avantaji ayni vitrinde net sekilde gorunur"
          description="Indirimli fiyatlar, kupon kodlari ve donemsel avantajlar kullanicinin karar hizini artiracak sekilde acik ve guven veren bir dille sunulur."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.8rem] bg-slate-900 p-8 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-200">
              Kampanya Mantigi
            </p>
            <p className="mt-4 text-3xl font-semibold leading-tight">
              Panelde tanimlanan her fiyat avantajı, vitrine anlik ve gorunur sekilde yansir.
            </p>
            <p className="mt-5 text-sm leading-8 text-slate-300">
              Indirimli fiyatlarin ustunde eski fiyat cizili sekilde gorunur, aktif kuponlar ise
              kullaniciyi talep akisi icinde yonlendirecek bir mesajla sunulur.
            </p>
          </div>

          <div className="rounded-[1.8rem] bg-[var(--color-coral-soft)] p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
              Ozel Not
            </p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              Reklam yerine kampanya, icerik ve guven hissiyle donusum artirmayi hedefliyoruz.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {campaignCards.map((item) => (
          <div
            key={item.title}
            className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
              {item.value}
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <SectionHeading
          eyebrow="SEO ve Donusum"
          title="Kampanya sayfasi sadece fiyat avantaji gostermek icin degil, organik trafik toplamak icin de kullanilir"
          description="Mevsimsel indirimler, uzun konaklama firsatlari ve kupon sayfalari dogru baslik ve icerik yapisiyla organik aramalarda guclu landing sayfalarina donusebilir."
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <p className="text-sm leading-8 text-slate-600">
            Erken rezervasyon, uzun konaklama ve kupon kampanyalari kullanicinin kararini
            hizlandirir. Fiyat avantajlari public tarafta net sekilde gorundugunde, kullanici
            guvenli hissettigi bir secim ortaminda ilerler.
          </p>
          <p className="text-sm leading-8 text-slate-600">
            Kampanya icerikleri SEO icin de degerlidir. “Kalkan erken rezervasyon villa indirimi”
            gibi niyet bazli aramalar icin bu sayfa zamanla daha da guclu bir giris noktasi haline
            gelebilir.
          </p>
        </div>
      </div>
    </Container>
  );
}
