import "server-only";
import { getCurrentPublicSiteTemplate } from "@/lib/server/public-site-template";
import { publicOrigin } from "@/lib/public-origin";

export async function getPublicMetadataBase() {
  const { company, domain } = await getCurrentPublicSiteTemplate();
  // Never derive canonical URLs from an arbitrary incoming Host header.
  const origin = publicOrigin(domain) ?? publicOrigin(company.primaryDomain) ?? publicOrigin(process.env.APP_URL) ?? publicOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  if (!origin && process.env.NODE_ENV === "production") throw new Error("Firma icin gecerli bir yayin domaini tanimlanmalidir.");
  return new URL(origin ?? "http://localhost:3000");
}
