import "server-only";

import { db } from "@/lib/db";
import type { DemoDefinitionStatus } from "@/lib/demo-definitions";
import { getDemoVillas } from "@/lib/server/demo-villa-store";
import { assertPanelCompanyAccess, resolvePanelCompanyId } from "@/lib/server/demo-company-context";
import {
  getFallbackParameterGroups,
  getFallbackRegionAirportRecords,
} from "@/lib/server/development-fallback-data";
import { withDevelopmentFallback } from "@/lib/server/development-fallback";
import {
  getDefaultCompanyId,
  iso,
  mapDefinitionStatusToDemo,
  mapDemoDefinitionStatusToPrisma,
} from "@/lib/server/prisma-demo-shared";

export class DemoDefinitionsStoreError extends Error {}

async function resolveDefinitionsCompanyId() {
  return (await resolvePanelCompanyId()) ?? (await getDefaultCompanyId());
}

export async function getDemoRegionAirportRecords() {
  return withDevelopmentFallback(
    async () => {
      const companyId = await resolveDefinitionsCompanyId();

      if (!companyId) {
        return [];
      }

      const [regions, villas] = await Promise.all([
        db.region.findMany({
          where: { OR: [{ companyId }, { companyId: null }] },
          include: {
            airports: {
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: [{ city: "asc" }, { name: "asc" }],
        }),
        getDemoVillas({ companyId }),
      ]);

      return regions.map((region) => {
        const airport = region.airports[0] ?? null;
        const villaCount = villas.filter((villa) => {
          if (villa.city.toLowerCase() !== region.city.toLowerCase()) {
            return false;
          }

          if (region.districtScope.length === 0) {
            return true;
          }

          return region.districtScope.some(
            (district) => district.toLowerCase() === (villa.district ?? "").toLowerCase(),
          );
        }).length;

        return {
          id: region.id,
          regionLabel: region.name,
          city: region.city,
          districtScope: region.districtScope,
          airportCode: airport?.code ?? "-",
          airportName: airport?.name ?? "Bagli havalimani yok",
          driveMinutes: airport?.driveMinutes ?? 0,
          status: mapDefinitionStatusToDemo(region.status),
          villaCount,
          updatedAt: iso(region.updatedAt),
        };
      });
    },
    async () => getFallbackRegionAirportRecords(await resolveDefinitionsCompanyId()),
  );
}

export async function getDemoParameterGroups() {
  return withDevelopmentFallback(
    async () => {
      const companyId = await resolveDefinitionsCompanyId();

      if (!companyId) {
        return [];
      }

      const groups = await db.parameterGroup.findMany({
        where: { companyId },
        orderBy: { label: "asc" },
      });

      return groups.map((group) => ({
        id: group.id,
        label: group.label,
        scope: group.scope,
        itemCount: group.itemCount,
        sampleItems: group.sampleItems,
        status: mapDefinitionStatusToDemo(group.status),
        note: group.note ?? "",
        updatedAt: iso(group.updatedAt),
      }));
    },
    async () => getFallbackParameterGroups(await resolveDefinitionsCompanyId()),
  );
}

export async function updateDemoRegionAirportStatus(
  regionId: string,
  status: DemoDefinitionStatus,
) {
  const region = await db.region.findUnique({
    where: { id: regionId },
  });

  if (!region) {
    throw new DemoDefinitionsStoreError("Bolge kaydi bulunamadi.");
  }

  await assertPanelCompanyAccess(region.companyId);

  const updated = await db.region.update({
    where: { id: regionId },
    data: {
      status: mapDemoDefinitionStatusToPrisma(status),
    },
    include: {
      airports: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const airport = updated.airports[0] ?? null;
  const villas = await getDemoVillas({ companyId: updated.companyId ?? undefined });
  const villaCount = villas.filter((villa) => {
    if (villa.city.toLowerCase() !== updated.city.toLowerCase()) {
      return false;
    }

    if (updated.districtScope.length === 0) {
      return true;
    }

    return updated.districtScope.some(
      (district) => district.toLowerCase() === (villa.district ?? "").toLowerCase(),
    );
  }).length;

  return {
    id: updated.id,
    regionLabel: updated.name,
    city: updated.city,
    districtScope: updated.districtScope,
    airportCode: airport?.code ?? "-",
    airportName: airport?.name ?? "Bagli havalimani yok",
    driveMinutes: airport?.driveMinutes ?? 0,
    status: mapDefinitionStatusToDemo(updated.status),
    villaCount,
    updatedAt: iso(updated.updatedAt),
  };
}

export async function updateDemoParameterGroupStatus(
  groupId: string,
  status: DemoDefinitionStatus,
) {
  const group = await db.parameterGroup.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw new DemoDefinitionsStoreError("Parametre grubu bulunamadi.");
  }

  await assertPanelCompanyAccess(group.companyId);

  const updated = await db.parameterGroup.update({
    where: { id: groupId },
    data: {
      status: mapDemoDefinitionStatusToPrisma(status),
    },
  });

  return {
    id: updated.id,
    label: updated.label,
    scope: updated.scope,
    itemCount: updated.itemCount,
    sampleItems: updated.sampleItems,
    status: mapDefinitionStatusToDemo(updated.status),
    note: updated.note ?? "",
    updatedAt: iso(updated.updatedAt),
  };
}
