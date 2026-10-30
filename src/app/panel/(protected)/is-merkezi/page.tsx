import { PanelPageHeader } from "@/components/panel/panel-page-header";
import { WorkCenter } from "@/components/panel/work-center";
import { getWorkCenter } from "@/lib/server/panel-workspace";
export const dynamic = "force-dynamic";
export default async function WorkCenterPage() {
  const data = await getWorkCenter();
  return <div className="work-stack"><PanelPageHeader eyebrow="Günlük işler" title="Bildirimler ve görevler" description="Takip edilmesi gereken konular, sorumlular ve son tarihler tek yerde." /><WorkCenter {...data} /></div>;
}
