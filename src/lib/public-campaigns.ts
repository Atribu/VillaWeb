import type { DemoDiscountCampaign } from "@/lib/demo-operations";
import type { CatalogVilla } from "@/lib/villa-catalog";

type PublicVilla = Pick<CatalogVilla, "companyId" | "slug" | "status">;
type PublicCampaign = Pick<DemoDiscountCampaign, "id" | "title" | "villaScope" | "percentOff" | "startDate" | "endDate">;

function isDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Campaign dates describe the stay period, not the date an inquiry must be sent.
export function getPublicCampaigns(campaigns: DemoDiscountCampaign[], villas: PublicVilla[], companyId: string, today: string): PublicCampaign[] {
  if (!companyId || !isDateKey(today)) return [];
  const publicSlugs = new Set(villas.filter((villa) => villa.companyId === companyId && villa.status === "ACTIVE").map((villa) => villa.slug));
  return campaigns.filter((campaign) =>
    campaign.companyId === companyId && campaign.active &&
    Number.isFinite(campaign.percentOff) && campaign.percentOff > 0 && campaign.percentOff <= 100 &&
    isDateKey(campaign.startDate) && isDateKey(campaign.endDate) &&
    campaign.startDate < campaign.endDate && campaign.endDate > today &&
    (campaign.villaScope === "ALL" ? publicSlugs.size > 0 : publicSlugs.has(campaign.villaScope)),
  ).sort((a, b) => a.startDate.localeCompare(b.startDate) || b.percentOff - a.percentOff)
    .map(({ id, title, villaScope, percentOff, startDate, endDate }) => ({ id, title, villaScope, percentOff, startDate, endDate }));
}
