import { DocumentsLibraryManager } from "@/components/panel/documents-library-manager";
import { getDemoDocuments } from "@/lib/server/demo-settings-store";

export const dynamic = "force-dynamic";

export default async function PanelDocumentsPage() {
  const documents = await getDemoDocuments();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Dokumanlar
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Ekip rehberlerini ve operasyon dokumanlarini durum bazinda yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Kullanimdaki rehberlerin aktifligi, taslaklari ve arsivlenen dokumanlar bu listede
          tutulur.
        </p>
      </div>

      <DocumentsLibraryManager documents={documents} />
    </div>
  );
}
