import { PanelPageHeader } from "@/components/panel/panel-page-header";
import { OwnerManager } from "@/components/panel/owner-manager";
import { getOwnerManagement } from "@/lib/server/owner-workspace";
export const dynamic = "force-dynamic";
export default async function OwnerManagementPage() {
  return <div className="work-stack"><PanelPageHeader eyebrow="Organizasyon" title="Villa sahipleri" description="Villa erişimlerini atayın ve tarih kapatma taleplerini değerlendirin." /><OwnerManager {...await getOwnerManagement()} /></div>;
}
