import type { MetadataRoute } from "next";
import { getPublicMetadataBase } from "@/lib/server/public-metadata";
import { getDemoVillas } from "@/lib/server/demo-villa-store";
import { travelGuides } from "@/lib/travel-journal";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await getPublicMetadataBase();
  const villas = await getDemoVillas({ publicSite: true, includeInactive: false, includeMetrics: false });
  const paths = ["/", "/villalar", "/kampanyalar", "/hakkimizda", "/iletisim", "/blog", "/sss",
    ...travelGuides.map((guide) => `/blog/${guide.slug}`), ...villas.map((villa) => `/villalar/${villa.slug}`)];
  return paths.map((pathname) => ({ url: new URL(pathname, base).href }));
}
