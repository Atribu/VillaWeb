import { SeoContentsManager } from "@/components/panel/seo-contents-manager";
import { getDemoSeoContents } from "@/lib/server/demo-websites-store";

export const dynamic = "force-dynamic";

export default async function PanelSeoContentsPage() {
  const contents = await getDemoSeoContents();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          SEO Icerikleri
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Blog, kategori ve landing iceriklerinin SEO kalitesini ayni listede yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Icerik durumu ve SEO skorunu panelden guncelleyerek yayina hazir backlogu hizli
          okuyabilirsin.
        </p>
      </div>

      <SeoContentsManager contents={contents} />
    </div>
  );
}
