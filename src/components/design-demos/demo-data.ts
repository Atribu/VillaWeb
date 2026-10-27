export const concepts = [
  { id: "kiyi", name: "Kıyı", note: "Sakin & zamansız" },
  { id: "rota", name: "Rota", note: "Keşif & kolaylık" },
  { id: "secki", name: "Seçki", note: "Özgün & seçkin" },
] as const;

export type Concept = (typeof concepts)[number]["id"];
export function isConcept(value: string): value is Concept {
  return concepts.some((concept) => concept.id === value);
}

// Isolated presentation data: the demos never read or mutate company records.
export const photos = {
  pool: "/uploads/villas/deneme/03-1-dis-4.webp",
  white: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=85",
  garden: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=85",
  terrace: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=85",
  room: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=85",
  beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
};

export type DemoVilla = {
  id: string;
  name: string;
  location: string;
  district: string;
  guests: number;
  beds: number;
  price: number;
  tag: string;
  collection: string;
  image: string;
  description: string;
};

export const villas: DemoVilla[] = [
  { id: "mavi", name: "Villa Mavi", location: "Kalkan", district: "Kızıltaş", guests: 6, beds: 3, price: 8500, tag: "Denize karşı", collection: "Deniz manzaralı", image: photos.pool, description: "Uzun kahvaltılar, havuz başında geçen öğleden sonraları ve denize açılan bir teras. Birlikte geçirilen zamana yer açan ferah bir kaçamak." },
  { id: "luma", name: "Villa Luma", location: "Bodrum", district: "Yalıkavak", guests: 8, beds: 4, price: 12500, tag: "Mimari seçki", collection: "Aileye özel", image: photos.white, description: "Yalın mimari, geniş yaşam alanları ve ışıkla dolu odalar. Kalabalık sofralar ve dostlarla paylaşılan yaz akşamları için düşünülmüş bir ev." },
  { id: "oliva", name: "Villa Oliva", location: "Fethiye", district: "Kayaköy", guests: 4, beds: 2, price: 6200, tag: "Doğanın içinde", collection: "Balayı", image: photos.garden, description: "Bahçenin sessizliği ve size ait bir havuz. Şehrin temposunu geride bırakıp günün ritmini kendiniz belirleyebileceğiniz bir mola." },
  { id: "terra", name: "Villa Terra", location: "Kaş", district: "Çukurbağ", guests: 6, beds: 3, price: 7800, tag: "Yavaş yaşa", collection: "Aileye özel", image: photos.terrace, description: "İçerisiyle dışarısının birbirine karıştığı geniş bir teras, doğal dokular ve rahat yaşam alanları. Acele etmeden yaşanan günler için." },
];

export const destinations = [
  { name: "Kalkan", text: "Denize açılan teraslar", image: photos.pool },
  { name: "Bodrum", text: "Ege'nin kendine has ritmi", image: photos.white },
  { name: "Fethiye", text: "Yeşilin içinde bir mola", image: photos.garden },
  { name: "Kaş", text: "Biraz daha yavaş yaşamak", image: photos.terrace },
];

export type DemoFilters = { location: string; guests: number; category: string; savedOnly: boolean };

export function filterDemoVillas(filters: DemoFilters, saved: readonly string[]) {
  return villas.filter((villa) =>
    (!filters.location || villa.location === filters.location) &&
    villa.guests >= filters.guests &&
    (filters.category === "Tüm villalar" || villa.collection === filters.category) &&
    (!filters.savedOnly || saved.includes(villa.id)),
  );
}

export function isValidStay(checkIn: string, checkOut: string, today: string) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(checkIn) || !datePattern.test(checkOut)) return false;
  const valid = (value: string) => {
    const date = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  return valid(checkIn) && valid(checkOut) && checkIn >= today && checkOut > checkIn;
}

export function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export const money = (value: number) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value);
