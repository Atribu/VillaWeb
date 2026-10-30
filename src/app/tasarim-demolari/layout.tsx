import type { Metadata } from "next";
import localFont from "next/font/local";

const sans = localFont({ src: "../../assets/fonts/manrope.woff2", weight: "200 800", style: "normal", variable: "--demo-sans", display: "swap" });
const serif = localFont({ src: "../../assets/fonts/cormorant-normal.woff2", weight: "400 600", style: "normal", variable: "--demo-serif", display: "swap" });

export const metadata: Metadata = {
  title: { absolute: "BookToVilla | Tasarım Stüdyosu" },
  description: "BookToVilla için üç farklı tasarım konsepti. Yalnızca örnek içerik içerir.",
  robots: { index: false, follow: false },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${sans.variable} ${serif.variable}`}>{children}</div>;
}
