import type { Metadata } from "next";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { pickLocalized } from "@/lib/i18n";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  const defaultTitle = pickLocalized(
    locale,
    "VillaWeb | Cok Firmali Villa Platformu",
    "VillaWeb | Multi-Company Villa Platform",
  );
  const description = pickLocalized(
    locale,
    "SEO odakli, cok firmali vitrine sahip villa kiralama platformu. Firma bazli portfoyleri inceleyin, tarih secin ve talep olusturun.",
    "An SEO-focused villa rental platform with a multi-company storefront. Browse company portfolios, choose dates and create an inquiry.",
  );

  return {
    metadataBase: new URL("https://villaweb.example"),
    title: {
      default: defaultTitle,
      template: "%s | VillaWeb",
    },
    description,
    keywords: pickLocalized(
      locale,
      [
        "villa kiralama",
        "premium villa",
        "kalkan villa",
        "fethiye villa",
        "bodrum villa",
        "ozel havuzlu villa",
      ],
      [
        "villa rental",
        "premium villa",
        "kalkan villa",
        "fethiye villa",
        "bodrum villa",
        "private pool villa",
      ],
    ),
    openGraph: {
      title: defaultTitle,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: pickLocalized(
        locale,
        "Firma bazli villa vitrinlerini, kampanyalari ve talep odakli kiralama akisini kesfedin.",
        "Discover company-specific villa storefronts, campaigns and an inquiry-driven rental flow.",
      ),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getCurrentLocale();

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body className="antialiased">{children}</body>
    </html>
  );
}
