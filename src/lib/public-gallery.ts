import type { CatalogVilla } from "@/lib/villa-catalog";

const heroImagesByCompany: Record<string, string> = {
  villavera:
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1800&q=80",
  "sahil-collection":
    "https://images.unsplash.com/photo-1613490908653-b0dc8325a643?auto=format&fit=crop&w=1800&q=80",
};

const regionImagesByDistrict: Record<string, string> = {
  Kas: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
  Kalkan:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  Fethiye:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  Bodrum:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
};

const villaImagesByDistrict: Record<string, string[]> = {
  Kas: [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
  ],
  Kalkan: [
    "https://images.unsplash.com/photo-1613490908653-b0dc8325a643?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
  ],
  Fethiye: [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80",
  ],
  Bodrum: [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
  ],
};

function hashIdToIndex(id: string, length: number) {
  if (length <= 1) {
    return 0;
  }

  const sum = id.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return sum % length;
}

export function getCompanyHeroImage(companySlug: string, fallback?: string) {
  return heroImagesByCompany[companySlug] ?? fallback;
}

export function getRegionPresentationImage(district: string, fallback?: string) {
  return regionImagesByDistrict[district] ?? fallback;
}

export function getVillaPresentationImage(villa: CatalogVilla) {
  const districtImages = villaImagesByDistrict[villa.district];

  if (districtImages && districtImages.length > 0) {
    return districtImages[hashIdToIndex(villa.id, districtImages.length)];
  }

  return villa.coverImageUrl;
}
