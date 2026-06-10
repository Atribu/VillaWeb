import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";

export function getNavigation(locale: AppLocale) {
  return [
    { href: "/", label: pickLocalized(locale, "Ana Sayfa", "Home") },
    { href: "/villalar", label: pickLocalized(locale, "Villalar", "Villas") },
    { href: "/kampanyalar", label: pickLocalized(locale, "Kampanyalar", "Campaigns") },
    { href: "/hakkimizda", label: pickLocalized(locale, "Hakkimizda", "About") },
    { href: "/blog", label: "Blog" },
    { href: "/iletisim", label: pickLocalized(locale, "Iletisim", "Contact") },
  ];
}

export function getCampaignCards(locale: AppLocale) {
  return [
    {
      title: pickLocalized(locale, "Erken Rezervasyon Avantaji", "Early Booking Advantage"),
      description: pickLocalized(
        locale,
        "Belirli tarih araliklarinda secili villalarda yuzde bazli kampanya gosterimi.",
        "Percentage-based campaigns for selected villas within specific date ranges.",
      ),
      value: pickLocalized(locale, "%15 indirim", "15% off"),
    },
    {
      title: pickLocalized(locale, "7 Gece ve Uzeri Konaklama", "Stays of 7 Nights or More"),
      description: pickLocalized(
        locale,
        "Uzun konaklamalarda gece basi maliyeti asagi ceken otomatik sezon kampanyalari.",
        "Automatic seasonal campaigns that lower the nightly cost on longer stays.",
      ),
      value: pickLocalized(locale, "Ek gece avantaji", "Extended stay benefit"),
    },
    {
      title: pickLocalized(locale, "Ozel Kupon Kodu", "Exclusive Coupon Code"),
      description: pickLocalized(
        locale,
        "Panelden tanimlanan kodlarla belirli villa veya donemlerde kupon kullandirimi.",
        "Coupon discounts that can be applied to selected villas or date ranges through panel-defined codes.",
      ),
      value: pickLocalized(locale, "Kod ile indirim", "Discount by code"),
    },
  ];
}

export function getFaqItems(locale: AppLocale) {
  return [
    {
      question: pickLocalized(locale, "Odeme alani ne zaman eklenecek?", "When will online payments be added?"),
      answer: pickLocalized(
        locale,
        "Ilk fazda kullanici talep ve randevu formu ile ilerleyecek. Odeme modulu ikinci fazda eklenmek uzere planlandi.",
        "In the first phase, users continue with inquiry and appointment flows. The payment module is planned for the second phase.",
      ),
    },
    {
      question: pickLocalized(locale, "Indirimli fiyatlar nasil gosterilecek?", "How will discounted prices be displayed?"),
      answer: pickLocalized(
        locale,
        "Aktif kampanya oldugunda eski fiyat ustu cizili gorunecek, yeni fiyat vurgulu kutu icinde sunulacak.",
        "When a campaign is active, the old price appears struck through and the discounted price is highlighted.",
      ),
    },
    {
      question: pickLocalized(locale, "Bir villaya olan ilgi nasil izlenecek?", "How is interest in a villa tracked?"),
      answer: pickLocalized(
        locale,
        "Villa detay sayfasindaki goruntulenmeler, talepler ve gelir verileri panelde villa bazli raporlanacak.",
        "Views, inquiries and revenue data from each villa detail page are reported in the panel on a villa basis.",
      ),
    },
  ];
}

export function getBlogPreview(locale: AppLocale) {
  return [
    {
      title: pickLocalized(
        locale,
        "Kalkan'da Villa Tatili Planlarken Dikkat Edilecek 7 Nokta",
        "7 Things to Consider When Planning a Villa Holiday in Kalkan",
      ),
      category: pickLocalized(locale, "Bolge Rehberi", "Destination Guide"),
    },
    {
      title: pickLocalized(
        locale,
        "Balayi Ciftleri Icin En Dogru Villa Nasil Secilir?",
        "How Should Honeymoon Couples Choose the Right Villa?",
      ),
      category: pickLocalized(locale, "Tatil Rehberi", "Travel Guide"),
    },
    {
      title: pickLocalized(
        locale,
        "Kalabalik Aileler Icin Havuzlu Villa Secim Rehberi",
        "Pool Villa Selection Guide for Large Families",
      ),
      category: pickLocalized(locale, "Aile Tatili", "Family Holidays"),
    },
  ];
}

export function getHomeTestimonials(locale: AppLocale) {
  return [
    {
      name: "Elif & Mert",
      text: pickLocalized(
        locale,
        "Secim sureci cok daha netti. Villa detaylarini gorup direkt tarih secerek hizli ilerledik.",
        "The decision process felt much clearer. We reviewed villa details and moved forward quickly by selecting the dates right away.",
      ),
    },
    {
      name: "Seda K.",
      text: pickLocalized(
        locale,
        "Aradigimiz bolgeyi ve villa tipini bulmak cok kolay oldu. Site yorucu hissettirmiyor.",
        "It was very easy to find the region and villa type we wanted. The site never feels exhausting.",
      ),
    },
    {
      name: "Caner A.",
      text: pickLocalized(
        locale,
        "Talep gonderdikten sonra ekip cok hizli donus yapti. Guven veren bir deneyimdi.",
        "After sending our inquiry, the team responded very quickly. It was a reassuring experience.",
      ),
    },
  ];
}

export const featuredVillas = [
  {
    name: "Villa Sole Mare",
    location: "Kas, Antalya",
    price: "12.500 TL",
    badge: "Deniz manzarali",
    description:
      "Gunesi tum gun alan sonsuzluk havuzu, 6 kisilik kapasite ve premium ic mekanlar.",
  },
  {
    name: "Villa Lora Cove",
    location: "Kalkan, Antalya",
    price: "15.900 TL",
    badge: "Aile dostu",
    description:
      "Genis bahce, cocuk havuzu ve kalabalik aileler icin sakin konum avantajiyla one cikiyor.",
  },
  {
    name: "Villa Serra Moon",
    location: "Fethiye, Mugla",
    price: "18.750 TL",
    badge: "Balayi secimi",
    description:
      "Iki kisilik romantik konsept, izole havuz alani ve gun batimi terasi ile hazirlandi.",
  },
];

export const quickStats = [
  { label: "Aktif villa", value: "48+" },
  { label: "Talep donusum odagi", value: "%100" },
  { label: "Bolge", value: "12" },
  { label: "Sezonluk kampanya", value: "8" },
];

export const categoryHighlights = [
  {
    title: "Balayi Villalari",
    text: "Mahremiyet, sakinlik ve ozel havuz detaylariyla romantik kacamaklar icin tasarlandi.",
  },
  {
    title: "Genis Aile Villalari",
    text: "Yuksek kapasite, bahce kullanimi ve birden fazla yasam alaniyla konforlu tatiller sunar.",
  },
  {
    title: "Luks Manzarali Villalar",
    text: "Gun batimi, deniz ve doga manzarasini bir araya getiren premium secenekler.",
  },
];

export const dashboardStats = [
  { label: "Toplam villa", value: "48", detail: "12 tanesi one cikan villa" },
  { label: "Bekleyen talep", value: "16", detail: "Bugun gelen 5 yeni kayit" },
  { label: "Aktif kampanya", value: "8", detail: "3 kupon kodu su an acik" },
  { label: "Aylik gelir", value: "1.280.000 TL", detail: "En yuksek gelir Villa Sole Mare" },
];

export const topVillaMetrics = [
  {
    title: "En cok incelenen villa",
    value: "Villa Lora Cove",
    meta: "Son 30 gunde 1.284 goruntulenme",
  },
  {
    title: "En cok talep alan villa",
    value: "Villa Sole Mare",
    meta: "Son 30 gunde 86 talep",
  },
  {
    title: "En cok gelir getiren villa",
    value: "Villa Serra Moon",
    meta: "Son 30 gunde 412.000 TL gelir",
  },
];
