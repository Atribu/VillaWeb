import type { Metadata } from "next";
import { getPublicMetadataBase } from "@/lib/server/public-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { metadataBase: await getPublicMetadataBase() };
}

export { PublicSiteShell as default } from "@/components/layout/public-site-shell";
