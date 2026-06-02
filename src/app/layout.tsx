import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://villaweb.example"),
  title: {
    default: "VillaWeb | Cok Firmali Villa Platformu",
    template: "%s | VillaWeb",
  },
  description:
    "SEO odakli, cok firmali vitrine sahip villa kiralama platformu. Firma bazli portfoyleri inceleyin, tarih secin ve talep olusturun.",
  keywords: [
    "villa kiralama",
    "premium villa",
    "kalkan villa",
    "fethiye villa",
    "bodrum villa",
    "ozel havuzlu villa",
  ],
  openGraph: {
    title: "VillaWeb | Cok Firmali Villa Platformu",
    description:
      "SEO odakli, cok firmali vitrine sahip villa kiralama platformu. Firma bazli portfoyleri inceleyin, tarih secin ve talep olusturun.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VillaWeb | Cok Firmali Villa Platformu",
    description:
      "Firma bazli villa vitrinlerini, kampanyalari ve talep odakli kiralama akisini kesfedin.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" data-scroll-behavior="smooth">
      <body className="antialiased">{children}</body>
    </html>
  );
}
