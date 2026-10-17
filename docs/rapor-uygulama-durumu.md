# Rapor uygulama durumu

Bu liste RAPOR.docx icindeki 15 maddeyi rapordaki sirayla izler. Uygulama hem
PostgreSQL hem yerel gelistirme fallback akisi icin hazirlanmistir. Canli sunucuya
bu calisma sirasinda baglanilmadi ve veri gonderilmedi.

## Maddeler

1. **Villanin icinde donemsel fiyatlar:** Villalar > Duzenle > Fiyat donemleri.
   Donem adi, baslangic/bitis, gecelik fiyat, temizlik ve minimum gece girilir.
   Duzenleme, pasife alma ve silme vardir. Aktif donemlerin cakismasi reddedilir.
   Talep fiyati her konaklama gecesinin donemine gore hesaplanir; alinan teklif
   kayda sabitlenir, sonraki fiyat degisiklikleri eski teklifi degistirmez.
2. **Manuel takvim kapatma:** Ayni duzenleme sayfasinda Takvim bolumu bulunur.
   Tek gun veya aralik kapatilabilir; formdaki son tarih kapali gunlere dahildir.
   Kayitlar teknik olarak bitis haric aralik tutulur. Misafir kapali geceleri
   secemez; API de kontrol eder. Rezervasyon onayi cakisan tarihte reddedilir.
3. **Ev sahibindeki villa adi:** Genel villa adindan ayri `ownerVillaName`
   kaydedilir; panel aramasina dahildir. Ziyaretci verisine dahil edilmez.
4. **Tedarikci bilgileri:** Ad, telefon, e-posta ve ic notlar Operasyon bolumunde
   tutulur. Public villa verisinden bu alanlar cikarilir.
5. **Giris/cikis saatleri:** Villa bazinda ayarlanir, detay sayfasinda ve
   konfirmasyonda gosterilir. Onaydan uretilen operasyon gorevlerine aktarilir.
6. **Kucuk harita:** Konum bolumundeki enlem/boylam ile villa detayinda harita
   gosterilir. Koordinatlar aralik ve cift girilme yonunden dogrulanir. Bosken
   sahte koordinat eklenmez; harita saglayicisi dis servis erisimi gerektirir.
7. **Mesafeler:** Market, deniz ve merkez metre; havalimani kilometre olarak
   girilir. Ondalik havalimani mesafesi desteklenir. Public detayda gosterilir.
8. **Olanak gruplari:** Mutfak, banyo, eglence, genel/konfor ve cevre gibi
   gruplarda coklu secim vardir. Kayit ve Turkce/Ingilizce karsiliklar korunur.
9. **Uygunluk:** Yasli, aile, cocuk ve evcil hayvan uygunlugu secilebilir.
   Evcil hayvana uygunluk ile evcil hayvan yasagi birlikte kaydedilemez.
10. **Ek ucretler:** Temizlik, elektrik, su, ek misafir ve aciklama alanlari
    vardir. Temizlik teklif toplamina dahildir. Elektrik/su/ek misafir bedelleri
    bilgilendirme amaclidir, otomatik tahsil edilmez; uygulama kosullari TR/EN
    not alanina yazilir. Bu ayrim panelde ve rezervasyon kosullarinda aciktir.
11. **Hasar depozitosu:** Ayri tutar olarak kaydedilir ve villa detayinda
    gosterilir; konaklama toplamina otomatik eklenmez veya karttan cekilmez.
12. **Ev kurallari:** Sigara, parti, evcil hayvan, sessiz saatler ve kayitli
    misafir kurallari hazir secimlidir; ek serbest metin TR/EN girilebilir.
13. **Villa bazli iCal:** Duzenleme sayfasinda imzali disari aktarim baglantisi
    vardir. Takvim kapali geceleri aktarir, misafir/tedarikci notlarini aktarmaz.
    Gecersiz imza reddedilir. RFC 5545 tarih/CRLF/satir katlama duzeni kullanilir.
    Dis platformun takvimi ne siklikla okuyacagi o platforma baglidir.
14. **Villa arama/filtre:** Panel villa listesinde kisa kod, ad, ev sahibindeki
    ad, lokasyon/bolge ve yayin durumu ile filtre; 12'li sayfalama vardir.
15. **Kosul onayi ve konfirmasyon:** Talep formunda kosul onayi zorunludur;
    sunucu da onayi ve guncel metin surumunu kontrol eder. Tarih/surum kaydedilir.
    Kosullar sayfasi TR/EN aciklama icerir. Onaylanan talep takvim blogu,
    operasyon gorevleri, fatura ve bekleyen odeme kaydi olusturur. Muhasebede
    tam odeme kaydedildiginde talep kartindaki konfirmasyon belgesi kesinlesir.
    Hazir mesaj kopyalanabilir, e-posta taslagi acilabilir, belge yazdirilabilir
    veya tarayicidan PDF alinabilir. Odeme geri alininca veya talep iptal edilince
    onayli belge durumu kaldirilir. Eski taleplere geriye donuk onay uydurulmaz.

## Panel gorunumu

- Tutarli beyaz/lacivert ust bar, etiketli menu, aktif sayfa vurgusu ve mobil menu.
- Talep aramasina bagli ust arama, daha kompakt dashboard ve villa listesi.
- Villa duzenlemede bolum kisayollari ve sabit kaydet dugmesi.
- Donem fiyatlari, takvim ve iCal ayni villa duzenleme sayfasinda.

## Dogrulama

`npm test` saf fiyat/tarih/iCal/gizlilik testlerini calistirir.
`npm run test:smoke` gecici dizinde fixture verisiyle ayri gelistirme sunucusu
acar. Mevcut `data/` kayitlarini kullanmaz veya degistirmez. Port 3012 varsayilan;
`SMOKE_PORT` ile degisebilir. Ayni checkout'ta baska Next dev calisiyorsa once
onu durdurun (Next dev kilidi ortaktir).

Smoke kontrolleri: fiyat donemi CRUD, cakisma, tek gun kapatma, iCal imzasi,
ozel alan gizliligi, firma kapsami, onay zorunlulugu, teklif hesabi,
talep-onay-fatura-odeme-konfirmasyon zinciri, odeme geri alma ve iptal.
Tarayici kontrolu icin `PLAYWRIGHT_MODULE` Playwright paket yoluna ayarlanabilir;
`PLAYWRIGHT_CHANNEL=chrome` yerel Chrome'u kullanir. Masaustu ve mobil ekranlar,
yatay tasma ve tarayici hatalari da kontrol edilir.

PostgreSQL servisi bu yerel ortamda calismadigindan gercek veritabani transaction,
kilit ve sema gecisi entegrasyon testleri burada yapilamadi. Bunlar staging'de
ayrica dogrulanmalidir; fallback testinin gecmesi PostgreSQL testi yerine gecmez.

## Canliya gecis

1. PostgreSQL ve yuklenen dosyalarin yedegini alin. Once staging'de uygulayin.
2. Kodlari guncelleyin ve `npm ci` calistirin. Canli ortamda fallback kapali olmali.
3. `DATABASE_URL`, guclu `SESSION_SECRET` ve `ICAL_SIGNING_SECRET` degerlerini
   sunucu ortaminda tanimlayin. Gizli anahtarlari Git'e eklemeyin. iCal anahtari
   degisirse eski disa aktarim baglantilarinin yeniden eklenmesi gerekir.
4. `npm run prisma:validate` ve `npm run prisma:db:push` ile yeni alanlari uygulayin.
   Projede henuz versioned migration zinciri yoktur. Veri kaybi uyarisi cikarsa
   durun; `--accept-data-loss` kullanmayin, uyariyi inceleyin.
5. `npm run build` Prisma Client'i otomatik uretir. Ardindan kullandiginiz servis
   yoneticisiyle uygulamayi yeniden baslatin. Mevcut canli veride seed calistirmayin.
6. Staging'de villa alanlarini kaydedip tekrar acin; bosaltmayi da deneyin.
   Donemli fiyat, kapali gece, iki eszamanli onay, kismi/tam odeme, odeme geri alma
   ve iptal akisini deneyin. Firma A kullanicisinin firma B kaydini degistiremedigini
   ve ziyaretci sayfasinda tedarikci notlari bulunmadigini kontrol edin.

## Dis bagimliliklar ve sinirlar

- Bu surum odeme altyapisi/sanal POS entegrasyonu veya otomatik e-posta gonderimi
  kurmaz. Muhasebe kaydi yetkili kullanici tarafindan girilir; e-posta butonu
  kullanicinin e-posta uygulamasinda taslak acar, kendiliginden gondermez.
- Rezervasyon kosullari mevcut yazilim akisinin aciklamasidir; firmaya ozel
  kiralama sozlesmesi, iptal/iade politikasi ve KVKK metni uzman onayindan
  gecirilmelidir. Teknik onay kaydi, metinlerin hukuken yeterli oldugunu kanitlamaz.
  KVKK sayfasinin mevcut taslak icerigi canli hukuki metin yerine kullanilmamalidir.
- Yayinlanmis kosul metni degisince yeni surum olusturun; eski onaylarla eslesen
  metni arsivleyin. Musteri icin olusan gizli durum baglantisini herkese acik yerde
  paylasmayin. Eski taleplerin kabul tarihi veya odemesi otomatik varsayilmaz.
- Eski donemlerde olusmus mukerrer veya cakisan kayitlar otomatik silinmez.
  Yeni islemler icin cakisma kontrolu vardir; eski kayitlar panelden incelenmelidir.
