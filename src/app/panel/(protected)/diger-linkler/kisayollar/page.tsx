import { ShortcutsManager } from "@/components/panel/shortcuts-manager";
import { getDemoShortcuts } from "@/lib/server/demo-external-links-store";

export const dynamic = "force-dynamic";

export default async function PanelShortcutsPage() {
  const shortcuts = await getDemoShortcuts();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Kisayollar
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Panel icindeki en sik kullanilan erisimleri durum bazinda yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Ekip akislarini hizlandiran dahili kisayollar bu listede tutulur.
        </p>
      </div>

      <ShortcutsManager shortcuts={shortcuts} />
    </div>
  );
}
