import { pickLocalized, type AppLocale } from "@/lib/i18n";

export function getPublicFaqGroups(locale: AppLocale) {
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  return [
    { id: "villa", title: t("Villa seçimi", "Choosing a villa"), items: [
      { id: "search", question: t("Bana uygun villayı nasıl bulabilirim?", "How can I find a villa that suits me?"), answer: t("Villa koleksiyonunda konum, tarih ve misafir sayısıyla arama yapabilirsiniz. Havuz tipi, kategori ve fiyat filtreleriyle sonuçları daraltıp villa detaylarından fotoğrafları ve olanakları inceleyebilirsiniz.", "Search the villa collection by destination, dates and guest count. Narrow the results by pool type, category and price, then explore the photos and amenities on the villa page.") },
      { id: "amenities", question: t("Her villada aynı olanaklar var mı?", "Do all villas have the same amenities?"), answer: t("Hayır. Oda sayısı, havuz tipi, ekipman ve ev kuralları villaya göre değişir. Seçtiğiniz villanın açıklamalarını kontrol edin. Listede olmayan bir özellik için ekibimizden bilgi alın.", "No. Bedrooms, pool types, equipment and house rules vary by villa. Check your chosen villa’s details and ask our team about any feature not listed.") },
      { id: "help", question: t("Seçim yaparken yardım alabilir miyim?", "Can I get help choosing?"), answer: t("İletişim sayfasındaki kanallardan bize ulaşabilirsiniz. Tercih ettiğiniz konumu, tarihleri, misafir sayısını ve önemli ihtiyaçlarınızı paylaşmanız seçenekleri değerlendirmemize yardımcı olur.", "You can reach us through the channels on our contact page. Sharing your preferred destination, dates, guest count and key requirements helps us discuss the options with you.") },
    ] },
    { id: "dates", title: t("Tarihler ve fiyatlar", "Dates and pricing"), items: [
      { id: "availability", question: t("Müsait günleri nereden görebilirim?", "Where can I see available dates?"), answer: t("Villa detayındaki takvimden uygun günleri seçebilirsiniz. Kapalı günler seçilemez. Seçilen dönem villanın minimum gece koşulunu da karşılamalıdır.", "Choose available dates in the calendar on the villa page. Blocked dates cannot be selected, and the chosen stay must meet the villa’s minimum-night requirement.") },
      { id: "price", question: t("Toplam konaklama tutarı nasıl hesaplanıyor?", "How is the stay total calculated?"), answer: t("Tarihlerinizi seçtiğinizde gece sayısı, seçili dönemin fiyatları, temizlik bedeli ve uygulanabilen indirimler fiyat özetinde gösterilir. Diğer ücret ve depozito açıklamalarını villa sayfasında ayrıca inceleyin.", "Once you choose dates, the price summary shows the nights, rates for the selected period, cleaning fee and applicable discounts. Review any other fee and deposit information separately on the villa page.") },
      { id: "discount", question: t("Kampanya ve kuponları nasıl kullanabilirim?", "How do I use offers and coupons?"), answer: t("Kampanya sayfasındaki geçerli konaklama dönemini ve villa kapsamını kontrol edin. Kupon kodunuz varsa talep formundaki kupon alanına girin; kodun ve seçilen konaklamanın uygunluğu kontrol edilir.", "Check the eligible stay period and villas on the offers page. If you have a coupon, enter it in the inquiry form; the code and its eligibility for your stay will be checked.") },
    ] },
    { id: "booking", title: t("Talep ve rezervasyon", "Inquiries and bookings"), items: [
      { id: "confirmation", question: t("Talep gönderince rezervasyonum kesinleşir mi?", "Does sending an inquiry confirm my reservation?"), answer: t("Talep göndermek tek başına kesin rezervasyon değildir. Firma talebinizi değerlendirir. Rezervasyon ve tam ödeme teyit edildiğinde durum sayfanızda onay bilgisi görünür.", "Sending an inquiry does not confirm a reservation. The company reviews your request. Your status page shows confirmation once the booking and full payment have been verified.") },
      { id: "payment", question: t("Talep formu kartımdan ödeme alır mı?", "Does the inquiry form charge my card?"), answer: t("Hayır, talep formu karttan tahsilat yapmaz. Ödeme yöntemini, tutarı ve ödeme koşullarını firma ile teyit edin.", "No, the inquiry form does not charge a card. Confirm the payment method, amount and payment terms with the company.") },
      { id: "changes", question: t("Tarih değişikliği veya iptal için ne yapmalıyım?", "How do I request a change or cancellation?"), answer: t("Villa adını veya talep referansınızı belirterek firma ile iletişime geçin. Değişiklik ve iptal koşulları size iletilen teklif üzerinden değerlendirilir; bu sitede otomatik iade işlemi yapılmaz.", "Contact the company with the villa name or your inquiry reference. Changes and cancellation are reviewed against your offer’s terms; this website does not process automatic refunds.") },
    ] },
  ];
}

export function normalizeFaqSearch(value: string) {
  return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").trim();
}
