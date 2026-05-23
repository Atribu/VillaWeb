import "server-only";

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  seedDemoParameterGroups,
  seedDemoRegionAirportRecords,
  type DemoDefinitionStatus,
} from "@/lib/demo-definitions";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

const demoDataDirectory = path.join(process.cwd(), "data");
const regionsFilePath = path.join(demoDataDirectory, "demo-region-airports.json");
const parameterGroupsFilePath = path.join(demoDataDirectory, "demo-parameter-groups.json");

export class DemoDefinitionsStoreError extends Error {}

async function ensureJsonFile<T>(filePath: string, seedData: T) {
  await mkdir(demoDataDirectory, { recursive: true });

  try {
    await access(filePath);
  } catch {
    await writeFile(filePath, JSON.stringify(seedData, null, 2), "utf8");
  }
}

async function readJsonFile<T>(filePath: string, seedData: T): Promise<T> {
  await ensureJsonFile(filePath, seedData);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function writeJsonFile<T>(filePath: string, value: T) {
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

async function syncRegionVillaCounts() {
  const [regions, villas] = await Promise.all([
    readJsonFile(regionsFilePath, seedDemoRegionAirportRecords),
    getDemoVillas(),
  ]);

  const syncedRegions = regions.map((region) => ({
    ...region,
    villaCount: villas.filter(
      (villa) =>
        villa.city.toLowerCase() === region.city.toLowerCase() &&
        region.districtScope.some(
          (district) => district.toLowerCase() === villa.district.toLowerCase(),
        ),
    ).length,
  }));

  await writeJsonFile(regionsFilePath, syncedRegions);
  return syncedRegions.sort((left, right) => left.regionLabel.localeCompare(right.regionLabel));
}

export async function getDemoRegionAirportRecords() {
  return syncRegionVillaCounts();
}

export async function getDemoParameterGroups() {
  const groups = await readJsonFile(parameterGroupsFilePath, seedDemoParameterGroups);
  return groups.sort((left, right) => left.label.localeCompare(right.label));
}

export async function updateDemoRegionAirportStatus(
  regionId: string,
  status: DemoDefinitionStatus,
) {
  const regions = await getDemoRegionAirportRecords();
  const regionIndex = regions.findIndex((region) => region.id === regionId);

  if (regionIndex === -1) {
    throw new DemoDefinitionsStoreError("Bolge kaydi bulunamadi.");
  }

  regions[regionIndex] = {
    ...regions[regionIndex],
    status,
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(regionsFilePath, regions);
  return regions[regionIndex];
}

export async function updateDemoParameterGroupStatus(
  groupId: string,
  status: DemoDefinitionStatus,
) {
  const groups = await getDemoParameterGroups();
  const groupIndex = groups.findIndex((group) => group.id === groupId);

  if (groupIndex === -1) {
    throw new DemoDefinitionsStoreError("Parametre grubu bulunamadi.");
  }

  groups[groupIndex] = {
    ...groups[groupIndex],
    status,
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(parameterGroupsFilePath, groups);
  return groups[groupIndex];
}
