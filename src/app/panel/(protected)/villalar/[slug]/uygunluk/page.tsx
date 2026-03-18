import Link from "next/link";
import { notFound } from "next/navigation";
import { VillaAvailabilityManager } from "@/components/panel/villa-availability-manager";
import { getDemoVillaBySlug } from "@/lib/server/demo-villa-store";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PanelVillaAvailabilityPage({ params }: PageProps) {
  const { slug } = await params;
  const villa = await getDemoVillaBySlug(slug);

  if (!villa) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
              Villa Uygunluk Yonetimi
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-[var(--color-ink)]">
              {villa.title} icin doluluk ve kapali tarihleri ayri ayri yonet
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              Bu ekran sadece secili villaya aittir. Personel veya admin, bu villanin rezervasyon,
              bakim ve kapali tarih bloklarini ekleyip silebilir. Public taraftaki uygunluk
              kontrolu otomatik olarak bu kayitlari kullanir.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/panel/villalar"
              className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-[var(--color-aqua)] hover:text-[var(--color-teal)]"
            >
              Villa Listesine Don
            </Link>
            <Link
              href={`/villalar/${villa.slug}`}
              className="inline-flex rounded-full bg-[var(--color-teal)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:rgba(15,118,110,0.9)]"
            >
              Public Detayi Ac
            </Link>
          </div>
        </div>
      </div>

      <VillaAvailabilityManager villa={villa} />
    </div>
  );
}
