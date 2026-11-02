import { requirePanelPermission } from "@/lib/server/panel-work-records";
import { factorEnabled } from "@/lib/server/second-factor";
import { PanelPageHeader } from "@/components/panel/panel-page-header";
import { SecondFactorSettings } from "@/components/panel/second-factor-settings";
export const dynamic = "force-dynamic";
export default async function SecurityPage() {
  const actor = await requirePanelPermission("companies");
  return <div className="work-stack"><PanelPageHeader eyebrow="Hesap güvenliği" title="İki aşamalı doğrulama" description="Süper admin hesabını şifrenin yanında doğrulama uygulamasıyla koruyun." /><SecondFactorSettings enabled={await factorEnabled(actor.id)} /></div>;
}
