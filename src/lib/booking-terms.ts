// Keep published versions unchanged so a recorded acceptance remains traceable.
export const BOOKING_TERMS_VERSION = "2026-10";

export const BOOKING_TERMS = [
  {
    title: { tr: "Talep ve kesin rezervasyon", en: "Inquiry and confirmed booking" },
    text: {
      tr: "Formun gonderilmesi bir konaklama talebidir; tek basina kesin rezervasyon veya odeme anlami tasimaz. Firma talebi degerlendirir. Rezervasyon ve tam odeme teyit edildiginde durum sayfanizda onay bilgisi gorunur.",
      en: "Submitting the form creates an accommodation inquiry, not a confirmed booking or a payment. The company reviews the inquiry. Your status page shows confirmation once the booking and full payment have been verified.",
    },
  },
  {
    title: { tr: "Tarihler, kapasite ve fiyat", en: "Dates, capacity and price" },
    text: {
      tr: "Giris ve cikis tarihlerini, misafir sayisini ve fiyat ozetini gonderimden once kontrol edin. Gece sayisi cikis gununu kapsamaz. Secilen donemin fiyatlari, asgari gece kosulu, temizlik bedeli ve uygulanan indirimler fiyat ozetinde hesaplanir.",
      en: "Review your arrival and departure dates, guest count and price summary before submitting. The departure day is not a charged night. Seasonal rates, minimum stay, cleaning fee and applicable discounts are reflected in the price summary.",
    },
  },
  {
    title: { tr: "Ek ucretler ve depozito", en: "Additional fees and deposit" },
    text: {
      tr: "Villa sayfasinda belirtilen elektrik, su ve ek misafir bedelleri ile hasar depozitosunu ayrica inceleyin. Bu kalemler fiyat ozetine otomatik eklenmez. Tutar, tahsilat zamani ve depozito iade kosullarini odeme oncesinde firmadan yazili olarak teyit edin.",
      en: "Review the electricity, water, extra guest fees and damage deposit listed on the villa page. These are not automatically added to the price summary. Confirm their amounts, payment timing and deposit return terms with the company in writing before paying.",
    },
  },
  {
    title: { tr: "Konaklama kurallari", en: "House rules" },
    text: {
      tr: "Sectiginiz villanin giris/cikis saatlerini, azami kapasitesini, evcil hayvan, sigara, parti ve diger ev kurallarini inceleyin. Ozel ihtiyaclariniz veya farkli saat talepleriniz varsa firma ile onceden gorusun.",
      en: "Review the selected villa's check-in/out times, capacity, pet, smoking, party and other house rules. Contact the company in advance about special needs or different arrival and departure times.",
    },
  },
  {
    title: { tr: "Odeme, degisiklik ve iptal", en: "Payment, changes and cancellation" },
    text: {
      tr: "Bu talep formu karttan tahsilat yapmaz. Odeme bilgilerini firma ile teyit edin. Degisiklik, iptal veya iade talepleri icin firmaya basvurun; bu sayfa otomatik iade veya tum villalar icin ortak bir iptal tarifesi tanimlamaz.",
      en: "This inquiry form does not charge a payment card. Verify payment instructions with the company. Contact the company for changes, cancellation or refunds; this page does not provide an automatic refund or a universal cancellation schedule for all villas.",
    },
  },
  {
    title: { tr: "Bilgileriniz ve durum baglantisi", en: "Your information and status link" },
    text: {
      tr: "Iletisim ve konaklama bilgilerinizi dogru girin. Talep durum baglantisi rezervasyon ve misafir bilgilerini gosterir; bu baglantiyi yalnizca ilgili kisilerle paylasin. Kisisel verilerin islenmesine iliskin aciklamalar KVKK Aydinlatma Metni'nde yer alir.",
      en: "Provide accurate contact and stay information. Your status link displays booking and guest details; share it only with the people concerned. Information about personal data processing is provided in the Privacy Notice.",
    },
  },
] as const;
