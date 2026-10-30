import Link from "next/link";
import { getUserSession } from "@/lib/auth/server-session";
import { getDefaultCompanyId } from "@/lib/server/prisma-demo-shared";
import { villaDraftKey } from "@/lib/villa-draft";
import { getPublicationPolicy } from "@/lib/server/publication-policy";
import { PanelPageHeader } from "@/components/panel/panel-page-header";
import { VillaForm } from "@/components/panel/villa-form";
import { VillaEditorNavigation } from "@/components/panel/villa-editor-navigation";
import { getDemoRegionAirportRecords } from "@/lib/server/demo-definitions-store";

export const dynamic = "force-dynamic";

export default async function PanelNewVillaPage() {
  const regions = await getDemoRegionAirportRecords();
  const session = await getUserSession();
  if (!session) return null;
  const companyId = session.companyId ?? await getDefaultCompanyId();
  if (!companyId) return null;
  const policy = await getPublicationPolicy(companyId);

  return (
    <div className="space-y-6">
      <PanelPageHeader eyebrow="Portföy / Yeni kayıt" title="Villa ekle"
        description="Bilgileri ve fotoğrafları ekleyin. İlk kayıttan sonra fiyat dönemlerini ve müsaitlik takvimini yönetebilirsiniz."
        actions={<Link href="/panel/villalar" className="panel-button-secondary">Listeye dön</Link>} />
      <div className="panel-editor-layout">
        <VillaEditorNavigation />
        <div className="min-w-0"><VillaForm regions={regions} companyId={companyId} publicationRequired={policy.required} draftKey={villaDraftKey(session.id, companyId, "new")} /></div>
      </div>
    </div>
  );
}
