import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { contactBlocks } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Iletisim",
  description:
    "Telefon, e-posta, WhatsApp ve destek akisi ile VillaVera ekibine hizli sekilde ulasin.",
};

export default function ContactPage() {
  return (
    <Container className="py-14 sm:py-16">
      <div className="rounded-[2.3rem] border border-black/6 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-8">
        <SectionHeading
          eyebrow="Iletisim"
          title="Kullanici talebini dogru ekibe, hizli sekilde yonlendiren iletisim alani"
          description="Telefon, WhatsApp ve e-posta bilgileriyle iletisim kolaylastirilir; destek yapisi kullaniciyi bir sonraki dogru aksiyona yonlendirir."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.8rem] bg-slate-900 p-8 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-200">
              Destek Sozu
            </p>
            <p className="mt-4 text-3xl font-semibold leading-tight">
              Talep, fiyat ve uygunluk sorularina hizli ve net geri donus sagliyoruz.
            </p>
            <p className="mt-5 text-sm leading-8 text-slate-300">
              Kullanici ile iletisim noktasi ne kadar net olursa, donusum de o kadar yuksek olur.
              Bu sayfa o yuzden sade, guven veren ve aksiyon odakli kurgulandi.
            </p>
          </div>

          <div className="rounded-[1.8rem] bg-[var(--color-slate-soft)] p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Hangi Konularda Yardimci Oluyoruz
            </p>
            <div className="mt-5 space-y-3">
              {[
                "Villa secimi ve bolge uygunlugu",
                "Tarih ve doluluk kontrolu",
                "Fiyat, kampanya ve kupon sorulari",
                "Talep kaydi sonrasi geri donus sureci",
              ].map((item) => (
                <div key={item} className="rounded-[1.2rem] bg-white px-4 py-3 text-sm font-medium text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {contactBlocks.map((item) => (
          <div
            key={item.title}
            className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
              {item.title}
            </p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">{item.value}</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {item.title === "Telefon"
                ? "Dogrudan cagri merkeziyle baglanti kurmak icin kullanilir."
                : item.title === "WhatsApp"
                  ? "Hizli mesajlasma ve bilgi paylasimi icin tercih edilir."
                  : "Detayli bilgi ve resmi iletisim sureci icin kullanilir."}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <SectionHeading
          eyebrow="Iletisim Formu Yapisi"
          title="Talep oncesi veya talep sonrasi destek icin form alani da bu kurguya uyumlu olacak"
          description="Kisa, net ve donusum odakli bir form; kullanicidan sadece gerekli bilgileri alip dogru aksiyona yonlendirecek sekilde tasarlanir."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {["Ad Soyad", "Telefon", "E-posta", "Mesajiniz"].map((field) => (
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
            href="/talep"
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Talep Ekranina Git
          </Link>
          <Link
            href="/villalar"
            className="rounded-full border border-black/8 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            Villalari Incele
          </Link>
        </div>
      </div>
    </Container>
  );
}
