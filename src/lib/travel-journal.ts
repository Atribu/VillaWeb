import type { AppLocale } from "@/lib/i18n";

type Bilingual = Record<AppLocale, string>;
type Guide = {
  slug: string;
  category: Bilingual;
  title: Bilingual;
  intro: Bilingual;
  sections: { title: Bilingual; text: Bilingual }[];
};

export const travelGuides: Guide[] = [
  {
    slug: "size-uygun-villayi-bulmak",
    category: { tr: "Villa seçimi", en: "Finding your villa" },
    title: { tr: "Bir ev değil, kendi tatilinizi seçin.", en: "Not just a villa. Your kind of holiday." },
    intro: { tr: "Manzara kadar gündelik küçük ayrıntılar da önemlidir. Villa aramaya başlamadan önce tatilinizden ne beklediğinize yer açın.", en: "The little everyday details matter as much as the view. Before you start browsing, make room for what you want from your holiday." },
    sections: [
      { title: { tr: "Önce tatilin ritmi", en: "Start with your pace" }, text: { tr: "Birlikte uzun sofralar mı, sessiz sabahlar mı, dışarıda geçirilen günler mi? Önceliklerinizi belirleyip konum ve misafir sayısıyla aramanızı daraltın. Her seçeneğin aynı olanakları sunmasını beklemek yerine sizin için önemli özellikleri not edin.", en: "Long meals together, quiet mornings or days spent exploring? Set your priorities, then narrow your search by destination and guest count. Rather than expecting every villa to have the same amenities, note the features that matter to you." } },
      { title: { tr: "Fotoğraftan ayrıntılara", en: "Look beyond the photos" }, text: { tr: "Galeriyi incelerken oda ve banyo sayısını, havuz tipini ve listelenen olanakları da kontrol edin. İhtiyacınız olan bir özellik açıklamada yoksa var olduğunu varsaymayın; seçiminizi yapmadan önce ekibe sorun.", en: "As you explore the gallery, check the bedroom and bathroom count, pool type and listed amenities. If a feature you need is not mentioned, do not assume it is available; ask the team before deciding." } },
      { title: { tr: "Karar vermeden önce", en: "Before you decide" }, text: { tr: "Ev kuralları, giriş ve çıkış saatleri de seçiminizin bir parçası olsun. Aklınıza takılanları villa adı veya kısa koduyla birlikte paylaşın. Böylece konuştuğunuz konaklama seçeneği her iki taraf için de net olur.", en: "Make house rules and check-in and check-out times part of your decision. Share your questions along with the villa name or short code so everyone knows which stay you are discussing." } },
    ],
  },
  {
    slug: "tarih-ve-konaklama-plani",
    category: { tr: "Tatil planlama", en: "Planning your stay" },
    title: { tr: "Takviminizde kendinize yer açın.", en: "Make room in your calendar." },
    intro: { tr: "Tarihler, gece sayısı ve fiyat özeti. Konaklama talebinizi göndermeden önce birlikte gözden geçirebileceğiniz küçük bir kontrol listesi.", en: "Dates, nights and your price summary. A short checklist to review before sending your stay inquiry." },
    sections: [
      { title: { tr: "Girişten çıkışa", en: "From arrival to departure" }, text: { tr: "Villa detayındaki takvimde uygun giriş ve çıkış günlerini seçin. Çıkış günü konaklanan gece sayısına dahil değildir. Aramanızda tarihleri değiştirdiğinizde uygunluk ve minimum gece şartını yeniden kontrol edin.", en: "Choose available arrival and departure dates in the villa calendar. The departure day is not a charged night. When changing your dates, check availability and the minimum stay again." } },
      { title: { tr: "Fiyat özetini okuyun", en: "Read the price summary" }, text: { tr: "Seçili tarihlere ait gece fiyatlarını, temizlik bedelini ve varsa indirimleri inceleyin. Villa sayfasındaki diğer ücret ve depozito açıklamalarına ayrıca bakın; aklınızdaki soruları ödeme yapmadan önce firma ile netleştirin.", en: "Review the nightly rates for your dates, the cleaning fee and any discounts. Also read the other fee and deposit information on the villa page, and clarify any questions with the company before paying." } },
      { title: { tr: "Talepten sonra", en: "After your inquiry" }, text: { tr: "Talep göndermek tek başına kesin rezervasyon değildir. İletişim bilgilerinizi doğru yazın ve durum bağlantınızı saklayın. Firma konaklama ve ödeme koşullarını sizinle paylaştığında planınızı bu bilgilere göre tamamlayın.", en: "Sending an inquiry does not by itself confirm a reservation. Enter accurate contact details and keep your status link. Complete your plans using the stay and payment information provided by the company." } },
    ],
  },
  {
    slug: "birlikte-villa-tatili",
    category: { tr: "Birlikte tatil", en: "Time together" },
    title: { tr: "Aynı çatı altında, güzel anlar.", en: "One roof. Moments together." },
    intro: { tr: "Aile ya da arkadaş grubu: herkesin ihtiyaçlarını baştan konuşmak, birlikte geçirilen zamanı daha rahat planlamanıza yardımcı olur.", en: "Family or friends: talking about everyone’s needs from the start helps you plan your time together." },
    sections: [
      { title: { tr: "Herkese yer var mı?", en: "Room for everyone?" }, text: { tr: "Misafir sayısını belirlerken tüm grubu hesaba katın. Kapasite kadar yatak odası ve banyo dağılımını da inceleyin. Bebek yatağı veya farklı yatak düzeni gibi ihtiyaçlarınız varsa önceden sorun.", en: "Include the whole group when setting your guest count. Check the bedroom and bathroom arrangement as well as the capacity. Ask in advance about needs such as a cot or a different bed arrangement." } },
      { title: { tr: "Ortak alanları düşünün", en: "Think about shared spaces" }, text: { tr: "Mutfak, yemek alanı, bahçe ve havuzla ilgili fotoğraf ve açıklamaları birlikte inceleyin. Herkesin beklentisini tek bir listede toplamak villa seçeneklerini karşılaştırmayı kolaylaştırabilir.", en: "Look through the kitchen, dining area, garden and pool photos and descriptions together. Gathering everyone’s expectations in one list can make comparing villas simpler." } },
      { title: { tr: "Küçük ayrıntıları paylaşın", en: "Share the little details" }, text: { tr: "Grubunuzla ev kurallarını ve giriş-çıkış saatlerini paylaşın. Farklı saatlerde gelecek misafirler veya özel ihtiyaçlar için firma ile önceden konuşun. Böylece varış gününü birlikte daha net planlayabilirsiniz.", en: "Share the house rules and arrival and departure times with your group. Speak to the company beforehand about guests arriving separately or any special needs, so you can plan your arrival day together." } },
    ],
  },
];

export function getTravelGuide(slug: string) {
  return travelGuides.find((guide) => guide.slug === slug);
}
