"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { concepts, destinations, filterDemoVillas, isValidStay, localToday, money, photos, type Concept, type DemoFilters, type DemoVilla } from "./demo-data";
import s from "./design-demo.module.css";

type IconName = "arrow" | "pin" | "people" | "bed" | "heart" | "search" | "check" | "close" | "sun" | "menu" | "wave";
function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M4 12h15M13 5l7 7-7 7" /></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    people: <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v3" /></>,
    bed: <><path d="M3 19V8M21 19V8M3 15h18M3 10h18v5H3zM6 10V5h12v5" /></>,
    heart: <path d="m12 21-8.5-8.5a5.4 5.4 0 0 1 7.6-7.6l.9.9.9-.9a5.4 5.4 0 0 1 7.6 7.6Z" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2" /></>,
    menu: <path d="M3 7h18M3 12h18M3 17h18" />,
    wave: <><path d="M2 16c4-6 6 6 10 0s6 6 10 0M2 21c4-6 6 6 10 0s6 6 10 0M5 11l7-8 7 8M8 10v4M16 10v4" /></>,
  };
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Photo({ src, alt, priority = false, className = "" }: { src: string; alt: string; priority?: boolean; className?: string }) {
  return <Image className={`${s.photo} ${className}`} src={src} alt={alt} fill unoptimized sizes="(max-width: 700px) 100vw, 50vw" priority={priority} />;
}

const categories = ["Tüm villalar", "Deniz manzaralı", "Balayı", "Aileye özel"];
const emptyFilters: DemoFilters = { location: "", guests: 1, category: "Tüm villalar", savedOnly: false };

export function DesignDemo({ concept }: { concept: Concept }) {
  const [filters, setFilters] = useState<DemoFilters>(emptyFilters);
  const [location, setLocation] = useState("");
  const [guests, setGuests] = useState(1);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [searchError, setSearchError] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [selected, setSelected] = useState<DemoVilla | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const today = localToday();
  const visibleVillas = filterDemoVillas(filters, saved);

  function scrollToVillas() {
    document.getElementById("villalar")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((checkIn || checkOut) && !isValidStay(checkIn, checkOut, today)) {
      setSearchError("Giriş ve çıkış tarihlerini kontrol edin. Çıkış, girişten sonra olmalı.");
      return;
    }
    setSearchError("");
    setFilters({ ...emptyFilters, location, guests });
    setSearchMessage(checkIn ? "Konum ve kişi sayısına göre örnek sonuçlar. Tarihler demo amaçlıdır; gerçek müsaitlik sorgulanmaz." : "Konum ve kişi sayısına göre örnek villalar gösteriliyor.");
    scrollToVillas();
  }

  function chooseDestination(value: string) {
    setLocation(value);
    setFilters({ ...emptyFilters, location: value });
    setGuests(1);
    setSearchMessage(`${value} için örnek koleksiyon.`);
    scrollToVillas();
  }

  function toggleSaved(id: string) {
    setSaved((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  }

  function clearFilters() {
    setFilters(emptyFilters);
    setLocation("");
    setGuests(1);
    setCheckIn("");
    setCheckOut("");
    setSearchMessage("");
    setSearchError("");
  }

  const searchForm = <form className={s.search} onSubmit={search} id="arama">
    <label className={s.locationField} htmlFor="demo-location"><span><Icon name="pin" /> Nereye?</span><select id="demo-location" value={location} onChange={(e) => setLocation(e.target.value)}><option value="">Tüm bölgeler</option>{destinations.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
    <label htmlFor="demo-checkin"><span>Giriş tarihi</span><input id="demo-checkin" aria-label="Giriş tarihi" type="date" min={today} value={checkIn} onChange={(e) => { setCheckIn(e.target.value); if (e.target.value >= checkOut) setCheckOut(""); }} /></label>
    <label htmlFor="demo-checkout"><span>Çıkış tarihi</span><input id="demo-checkout" aria-label="Çıkış tarihi" type="date" min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} /></label>
    <label htmlFor="demo-guests"><span><Icon name="people" /> Misafir</span><select id="demo-guests" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6, 7, 8].map((count) => <option key={count} value={count}>{count} kişi</option>)}</select></label>
    <button type="submit" className={s.searchButton}><Icon name="search" /><span>Villa bul</span></button>
    {searchError && <p className={s.searchError} role="alert">{searchError}</p>}
  </form>;

  const destinationsSection = <section className={`${s.section} ${s.destinationsSection}`} id="bolgeler">
    <div className={s.sectionHeading}><div><p className={s.eyebrow}>BİR YER DEĞİL, BİR HİS</p><h2>{concept === "secki" ? <>Her kıyının<br /><em>bir hikâyesi var.</em></> : "Sizi hangi kıyı çağırıyor?"}</h2></div><p>Birbirinden farklı dört rota.<br />Hepsinde size ait bir tatil.</p></div>
    <div className={s.destinations}>{destinations.map((item, index) => <button key={item.name} className={s.destination} onClick={() => chooseDestination(item.name)} aria-label={`${item.name} villalarını göster`}><Photo src={item.image} alt={`${item.name} koleksiyonu için temsili villa fotoğrafı`} /><span className={s.destinationNumber}>0{index + 1}</span><span className={s.destinationCaption}><span><strong>{item.name}</strong><small>{item.text}</small></span><Icon name="arrow" /></span></button>)}</div>
  </section>;

  const listingSection = <section className={`${s.section} ${s.listingSection}`} id="villalar">
    <div className={s.sectionHeading}><div><p className={s.eyebrow}>{concept === "secki" ? "THE PRIVATE COLLECTION / 01" : "SİZİN İÇİN SEÇTİK"}</p><h2>{concept === "kiyi" ? <>İyi hissettiren <em>evler.</em></> : concept === "rota" ? "Sıradaki güzel anınız burada." : <>Sıradan olmayan<br /><em>adresler.</em></>}</h2></div><button className={s.textButton} onClick={clearFilters}>Tüm koleksiyonu gör <Icon name="arrow" /></button></div>
    <div className={s.filters} aria-label="Villa koleksiyonları">{categories.map((category) => <button key={category} onClick={() => setFilters((value) => ({ ...value, category }))} aria-pressed={filters.category === category}>{category}</button>)}<button className={s.savedFilter} onClick={() => setFilters((value) => ({ ...value, savedOnly: !value.savedOnly }))} aria-pressed={filters.savedOnly}><Icon name="heart" /> Favoriler{saved.length > 0 ? ` (${saved.length})` : ""}</button></div>
    <div className={s.resultNote} role="status">{searchMessage && <span>{searchMessage}</span>}{(searchMessage || filters.savedOnly || filters.category !== "Tüm villalar") && <strong>{visibleVillas.length} örnek villa</strong>}</div>
    <div className={s.villaGrid}>{visibleVillas.map((villa, index) => <article className={s.villaCard} key={villa.id}>
      <div className={s.cardMedia}><button className={s.imageButton} onClick={() => setSelected(villa)} aria-label={`${villa.name} detaylarını aç`}><Photo src={villa.image} alt={`${villa.name} için temsili havuzlu ev fotoğrafı`} /></button><span className={s.cardTag}>{villa.tag}</span><button className={s.favorite} onClick={() => toggleSaved(villa.id)} aria-label={`${villa.name} ${saved.includes(villa.id) ? "favorilerden çıkar" : "favorilere ekle"}`} aria-pressed={saved.includes(villa.id)}><Icon name="heart" /></button>{concept === "secki" && <span className={s.cardIndex}>0{index + 1}</span>}</div>
      <div className={s.cardBody}><p className={s.cardLocation}>{villa.location} / {villa.district}</p><button className={s.cardTitle} onClick={() => setSelected(villa)}>{villa.name}<Icon name="arrow" /></button><div className={s.cardAmenities}><span><Icon name="people" /> {villa.guests} misafir</span><span><Icon name="bed" /> {villa.beds} yatak odası</span><span>Özel havuz</span></div><div className={s.cardPrice}><span><strong>{money(villa.price)} ₺</strong> / gece</span><span>Örnek fiyat</span></div></div>
    </article>)}</div>
    {visibleVillas.length === 0 && <div className={s.empty}><Icon name="search" /><h3>Bu seçimde örnek villa bulunamadı.</h3><p>Başka bir bölge deneyin veya filtreleri temizleyin.</p><button className={s.primaryButton} onClick={clearFilters}>Filtreleri temizle</button></div>}
  </section>;

  return <div className={`${s.root} ${s[concept]}`}>
    <a className={s.skipLink} href="#icerik">İçeriğe geç</a>
    <div className={s.studioBar}><span className={s.studioLabel}>TASARIM STÜDYOSU <span>/</span></span><nav aria-label="Tasarım demoları">{concepts.map((item, index) => <Link key={item.id} href={`/tasarim-demolari/${item.id}`} aria-current={concept === item.id ? "page" : undefined}><span>0{index + 1}</span> {item.name}</Link>)}</nav><span className={s.demoNotice}>Örnek içerik · Gerçek rezervasyon yapılmaz</span></div>
    <header className={s.header}><a href="#" className={s.logo} aria-label="BookToVilla demo ana sayfa"><Icon name="wave" /><span>bookto<strong>villa</strong><i>®</i></span></a><nav className={`${s.mainNav} ${mobileMenu ? s.menuOpen : ""}`} aria-label="Ana menü"><a href="#villalar" onClick={() => setMobileMenu(false)}>Villaları keşfet</a><a href="#bolgeler" onClick={() => setMobileMenu(false)}>Bölgeler</a><a href="#hikayemiz" onClick={() => setMobileMenu(false)}>Bizimle tatil</a><a href="#sorular" onClick={() => setMobileMenu(false)}>Merak ettikleriniz</a></nav><a href="#arama" className={s.headerCta}>Tatilini planla <Icon name="arrow" /></a><button className={s.menuToggle} aria-label={mobileMenu ? "Menüyü kapat" : "Menüyü aç"} aria-expanded={mobileMenu} onClick={() => setMobileMenu(!mobileMenu)}><Icon name={mobileMenu ? "close" : "menu"} /></button></header>
    <main id="icerik">
      {concept === "kiyi" && <section className={s.hero}><Photo src={photos.pool} alt="Özel yüzme havuzu ve geniş terasıyla modern bir villa" priority /><div className={s.heroShade} /><div className={s.heroContent}><p className={s.eyebrow}>KENDİNİZE AYIRDIĞINIZ BİR YAZ</p><h1>Biraz uzaklaş.<br /><em>Kendine yaklaş.</em></h1><p>Kapısını yalnızca sizin açtığınız evler.<br />Ege&apos;den Akdeniz&apos;e, size ait bir tatil.</p><a className={s.heroLink} href="#villalar">Koleksiyonu keşfet <Icon name="arrow" /></a></div><div className={s.heroCaption}><span>01 / 04</span><span>KALKAN KOLEKSİYONU<br /><small>Denize karşı, hayata bir mola.</small></span></div><div className={s.searchWrap}>{searchForm}</div></section>}
      {concept === "rota" && <section className={s.hero}><div className={s.rotaHeroGrid}><div className={s.heroContent}><p className={s.eyebrow}><span className={s.liveDot} /> DAHA AZ PLAN, DAHA ÇOK TATİL</p><h1>Tatilin bir<br /><span>adresi var.</span><svg className={s.scribble} viewBox="0 0 300 16" aria-hidden="true"><path d="M3 12Q120-3 295 7" /></svg></h1><p>Havuzu size özel, manzarası unutulmaz.<br />Kendinize göre bir villa bulun, gerisini hayal edin.</p><div className={s.heroPerks}><span><Icon name="check" /> Özel alan</span><span><Icon name="check" /> Birlikte daha güzel</span></div></div><div className={s.rotaPhotos}><div className={s.rotaMainPhoto}><Photo src={photos.white} alt="Palmiyelerle çevrili beyaz villa" priority /></div><div className={s.rotaSmallPhoto}><Photo src={photos.pool} alt="Güneşli bir günde villa havuzu" priority /></div><span className={s.photoSticker}><Icon name="sun" /><span>Güzel günler<br /><strong>yakında.</strong></span></span><span className={s.photoLocation}><Icon name="pin" /> Bir sonraki durağın: Ege</span></div></div><div className={s.searchWrap}>{searchForm}</div></section>}
      {concept === "secki" && <><section className={s.hero}><div className={s.heroContent}><p className={s.eyebrow}>BOOKTOVILLA PRIVATE COLLECTION</p><h1>Olağanın<br /><em>dışında.</em></h1><p>Bir evden fazlasını arayanlara.<br />Mimarisi, doğası ve hissiyle ayrışan<br />özel bir villa seçkisi.</p><a className={s.heroLink} href="#villalar">Seçkiyi incele <span><Icon name="arrow" /></span></a><span className={s.edition}>AKDENİZ / EGE <span>VOL. 01</span></span></div><div className={s.seckiHeroPhoto}><Photo src={photos.terrace} alt="Modern mimarili, açık teraslı özel villa" priority /><span className={s.verticalLabel}>A DIFFERENT KIND OF STAY</span><div className={s.seckiPhotoCaption}><span>Doğayla aynı ritimde.</span><small>THE SLOW LIVING EDIT</small></div></div></section><div className={s.seckiSearch}><p>Tatilinizin<br /><strong>çerçevesini çizin.</strong></p>{searchForm}</div></>}
      <div className={s.promiseStrip}><span><Icon name="wave" /> Otel odası değil, kendi eviniz.</span><span><Icon name="sun" /> Kendi ritminizde bir tatil.</span><span><Icon name="people" /> Sevdiklerinizle, bir arada.</span></div>
      {concept === "kiyi" ? <>{destinationsSection}{listingSection}</> : <>{listingSection}{destinationsSection}</>}
      <section className={s.story} id="hikayemiz"><div className={s.storyPhoto}><Photo src={concept === "secki" ? photos.room : photos.terrace} alt="Tatil evinde dinlenmeye ayrılmış ferah bir yaşam alanı" /><span>AZ PLAN. ÇOK HATIRA.</span></div><div className={s.storyContent}><p className={s.eyebrow}>TATİLİN EN GÜZEL HALİ, SİZİN HALİNİZ.</p><h2>{concept === "rota" ? <>Sabahın alarmı<br />olmasın mesela.</> : <>Hiçbir yere<br /><em>yetişmek zorunda değil.</em></>}</h2><p>İster uzun bir aile sofrası, ister iki kişilik sessiz bir sabah. Tatilinizi bir programa değil, kendinize göre yaşayın.</p><div className={s.storySteps}><span><b>01</b> Sizi anlatan evi bulun.</span><span><b>02</b> Tarihlerinizi seçin.</span><span><b>03</b> Güzel günlere yer açın.</span></div><a href="#arama" className={s.textButton}>Kendi tatilimi bul <Icon name="arrow" /></a></div></section>
      <section className={`${s.section} ${s.faq}`} id="sorular"><div><p className={s.eyebrow}>AKLINIZDA KALMASIN</p><h2>Küçük sorular.<br /><em>Net cevaplar.</em></h2><p>Bu sayfa bir tasarım demosudur.<br />Görseller ve fiyatlar temsilidir.</p></div><div className={s.faqList}>{[
        ["Bu demoda rezervasyon yapabilir miyim?", "Bu sayfa yalnızca tasarımı ve kullanım deneyimini değerlendirmek için hazırlandı. Villa önizlemelerini açabilir, favorilere ekleyebilir ve örnek talep akışını deneyebilirsiniz. Hiçbir kayıt veya ödeme oluşturulmaz."],
        ["Arama ve filtreler nasıl çalışıyor?", "Konum, misafir sayısı ve koleksiyon seçimi dört örnek villa üzerinde çalışır. Tarihler kontrol edilir ancak gerçek doluluk takvimine bağlanmaz."],
        ["Beğendiğimiz tasarım mevcut siteye uygulanabilir mi?", "Evet. Seçilen tasarım, mevcut firma yapısı, villa verileri, fiyatlandırma ve rezervasyon akışları korunarak ayrıca uyarlanabilir. Bu demolar mevcut siteyi değiştirmez."],
      ].map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>
      <section className={s.closing}><span>Bir sonraki güzel hatıranız.</span><h2>Bir villa kadar <em>yakın.</em></h2><a href="#arama">Tatilini keşfet <Icon name="arrow" /></a></section>
    </main>
    <footer className={s.footer}><a href="#" className={s.logo}><Icon name="wave" /><span>bookto<strong>villa</strong><i>®</i></span></a><span>Size ait bir yer. Size ait bir tatil.</span><p>© {new Date().getFullYear()} BookToVilla <span>· Tasarım konsepti / {concepts.find((item) => item.id === concept)?.name}</span></p><a href="#">Başa dön ↑</a></footer>
    {selected && <VillaDialog villa={selected} checkIn={checkIn} checkOut={checkOut} today={today} onClose={() => setSelected(null)} />}
  </div>;
}

function VillaDialog({ villa, checkIn, checkOut, today, onClose }: { villa: DemoVilla; checkIn: string; checkOut: string; today: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [photo, setPhoto] = useState(0);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const gallery = [villa.image, photos.room, villa.image === photos.terrace ? photos.pool : photos.terrace];
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!isValidStay(String(data.get("checkIn")), String(data.get("checkOut")), today)) {
      setError("Geçerli bir giriş ve çıkış tarihi seçin. Çıkış tarihi girişten sonra olmalı.");
      return;
    }
    setError("");
    setSent(true);
  }

  return <dialog ref={dialog} className={s.dialog} aria-labelledby="villa-dialog-title" onClose={onClose} onClick={(event) => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
  }}><div className={s.dialogInner}><button autoFocus className={s.dialogClose} aria-label="Önizlemeyi kapat" onClick={onClose}><Icon name="close" /></button><div className={s.dialogPhoto}><Photo src={gallery[photo]} alt={`${villa.name} temsili galeri fotoğrafı ${photo + 1}`} /><div className={s.galleryControls}><button onClick={() => setPhoto((photo + gallery.length - 1) % gallery.length)} aria-label="Önceki fotoğraf">←</button><span aria-live="polite">{photo + 1} / {gallery.length}</span><button onClick={() => setPhoto((photo + 1) % gallery.length)} aria-label="Sonraki fotoğraf">→</button></div></div><div className={s.dialogBody}><p className={s.eyebrow}>{villa.location} / {villa.district} · ÖRNEK VİLLA</p><h2 id="villa-dialog-title">{villa.name}</h2><p>{villa.description}</p><div className={s.dialogAmenities}><span><Icon name="people" />{villa.guests} misafir</span><span><Icon name="bed" />{villa.beds} yatak odası</span><span><Icon name="wave" />Özel havuz</span></div><p className={s.dialogPrice}><strong>{money(villa.price)} ₺</strong> / gece <small>Temsili fiyat</small></p>{sent ? <div className={s.success} role="status"><Icon name="check" /><h3>Örnek akış tamamlandı.</h3><p>Bu bir tasarım demosu. Bilgileriniz gönderilmedi, rezervasyon veya ödeme oluşturulmadı.</p><button className={s.primaryButton} onClick={onClose}>Keşfetmeye devam et</button></div> : <form className={s.inquiry} onSubmit={submit}><h3>Tatilinizi hayal etmeye başlayın.</h3><div><label>Adınız<input name="name" required placeholder="Adınız ve soyadınız" autoComplete="off" /></label><label>E-posta<input name="email" type="email" required placeholder="ornek@eposta.com" autoComplete="off" /></label><label>Giriş<input aria-label="Talep giriş tarihi" type="date" name="checkIn" min={today} required defaultValue={checkIn} /></label><label>Çıkış<input aria-label="Talep çıkış tarihi" type="date" name="checkOut" min={today} required defaultValue={checkOut} /></label></div>{error && <p role="alert">{error}</p>}<button className={s.primaryButton} type="submit">Örnek talebi dene <Icon name="arrow" /></button><small>Yalnızca demo. Bu form sunucuya bilgi göndermez.</small></form>}</div></div></dialog>;
}
