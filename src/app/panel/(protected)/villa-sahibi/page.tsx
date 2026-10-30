import { PanelPageHeader } from "@/components/panel/panel-page-header";
import { OwnerPortal } from "@/components/panel/owner-portal";
import { getOwnerWorkspace } from "@/lib/server/owner-workspace";
import { todayInTurkey } from "@/lib/booking-dates";
export const dynamic = "force-dynamic";
export default async function OwnerPage() {
  return <div className="work-stack"><PanelPageHeader eyebrow="Villa sahibi" title="Villalarım" description="Size atanmış villaların doluluğunu inceleyin ve tarih kapatma talep edin." /><OwnerPortal {...await getOwnerWorkspace()} today={todayInTurkey()} /></div>;
}
