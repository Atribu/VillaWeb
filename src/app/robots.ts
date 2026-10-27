import type { MetadataRoute } from "next";
import { getPublicMetadataBase } from "@/lib/server/public-metadata";

export const dynamic = "force-dynamic";
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getPublicMetadataBase();
  return { rules: { userAgent: "*", allow: "/", disallow: ["/panel", "/api/", "/rezervasyon/", "/talep", "/tasarim-demolari"] }, sitemap: new URL("/sitemap.xml", base).href };
}
