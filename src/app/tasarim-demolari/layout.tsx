import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

const sans = Manrope({ subsets: ["latin", "latin-ext"], variable: "--demo-sans", display: "swap" });
const serif = Cormorant_Garamond({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], variable: "--demo-serif", display: "swap" });

export const metadata: Metadata = {
  title: { absolute: "BookToVilla | Tasarım Stüdyosu" },
  description: "BookToVilla için üç farklı tasarım konsepti. Yalnızca örnek içerik içerir.",
  robots: { index: false, follow: false },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${sans.variable} ${serif.variable}`}>{children}</div>;
}
