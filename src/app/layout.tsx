import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://villaweb.example"),
  title: {
    default: "VillaVera | Premium Villa Kiralama Deneyimi",
    template: "%s | VillaVera",
  },
  description:
    "SEO odakli, premium vitrine sahip villa kiralama platformu. Ozel villalari inceleyin, tarih secin ve hizli talep olusturun.",
  keywords: [
    "villa kiralama",
    "premium villa",
    "kalkan villa",
    "fethiye villa",
    "bodrum villa",
    "ozel havuzlu villa",
  ],
  openGraph: {
    title: "VillaVera | Premium Villa Kiralama Deneyimi",
    description:
      "SEO odakli, premium vitrine sahip villa kiralama platformu. Ozel villalari inceleyin, tarih secin ve hizli talep olusturun.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VillaVera | Premium Villa Kiralama Deneyimi",
    description:
      "Premium villa vitrinini, kampanyalari ve talep odakli kiralama akisini kesfedin.",
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
