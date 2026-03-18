import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Hakkimizda",
  description:
    "VillaVera'nin hizmet anlayisini, operasyon modelini ve neden tercih edildigini anlatan kurumsal sayfa.",
};

const valueCards = [
  {
    title: "Secili portfoy anlayisi",
    text: "Her villa vitrinde yer almadan once icerik, fiyat, gorsel kalite ve talep akisina uygunluk acisindan degerlendirilir.",
  },
  {
    title: "Hizli geri donus sureci",
    text: "Talep gonderen kullaniciya hizli donus saglayacak panel ve operasyon mantigi ile donusum odakli bir akis kurulur.",
  },
  {
    title: "Panel destekli yonetim",
    text: "Fiyat, kampanya, kupon ve doluluk takvimi tek panelden yonetilerek vitrine anlik sekilde yansitilir.",
  },
];

const processSteps = [
  "Personel villayi ekler, gorselleri ve SEO alanlarini doldurur.",
  "Admin fiyatlari, kampanyalari ve doluluk takvimini yonetir.",
  "Kullanici vitrine girer, villayi inceler, tarihi secer ve talep gonderir.",
  "Operasyon ekibi talebi hizli sekilde dogru villaya yonlendirir.",
];

export default function AboutPage() {
  return (
    <Container className="py-14 sm:py-16">
      <div className="rounded-[2.3rem] border border-black/6 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-8">
        <SectionHeading
          eyebrow="Marka Hikayesi"
          title="Kurumsal guven ve modern deneyim ayni cizgide bulusuyor"
          description="VillaVera; secili villa portfoyu, hizli talep akisi ve panel destekli yonetim mantigiyle sadece guzel gorunen degil, gercekten calisan bir kiralama sistemi kurmak icin tasarlandi."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.8rem] bg-slate-900 p-8 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-200">
              VillaVera Yaklasimi
            </p>
            <p className="mt-4 text-3xl font-semibold leading-tight">
              Kullaniciya sade bir deneyim, operasyona net bir kontrol alani sunuyoruz.
            </p>
            <p className="mt-5 text-sm leading-8 text-slate-300">
              Modern vitrin dili, SEO destekli sayfa yapisi ve yonetilebilir panel mantigi birlikte
              calisir. Boylece site hem arama motorlarinda guclu gorunur hem de kullaniciyi net
              bir aksiyona, yani tarih secimli talep olusturmaya goturur.
            </p>
          </div>

          <div className="rounded-[1.8rem] bg-[var(--color-coral-soft)] p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
              Neyi Cozuyoruz
            </p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              Daginik icerik, karisik fiyat bilgisi ve yavas geri donus sorunlarini ortadan
              kaldiriyoruz.
            </p>
            <p className="mt-4 text-sm leading-8 text-slate-600">
              Her villa kendi detayinda net sekilde anlatilir. Takvim mantigi, fiyat, kampanya ve
              talep akisi tek duzende ilerler.
            </p>
          </div>
        </div>
      </div>

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
            eyebrow="Operasyon Akisi"
            title="Sistem panelden vitrine tek bir duzende baglanir"
            description="Bu platform sadece bir tasarim vitrini degil; personel, admin ve public tarafin ayni veri yapisi ustunde birlikte calistigi bir operasyon kurgusudur."
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

      <div className="mt-10 rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <SectionHeading
          eyebrow="Kurumsal Not"
          title="Marka dili, destek hizi ve guven hissi bu sayfada gucleniyor"
          description="Hakkimizda sayfasi sadece resmi bir tanitim alani degil; kullanicinin dogru yerden hizmet aldigina ikna oldugu guven katmanidir."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/villalar"
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Villa Koleksiyonunu Incele
          </Link>
          <Link
            href="/iletisim"
            className="rounded-full border border-black/8 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            Bize Ulas
          </Link>
        </div>
      </div>
    </Container>
  );
}
