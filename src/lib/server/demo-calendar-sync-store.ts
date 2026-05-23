import "server-only";

import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  seedDemoChannelMappings,
  seedDemoIcalSources,
  seedDemoSyncLogs,
  type DemoCalendarSourceStatus,
  type DemoSyncLogRecord,
  type DemoSyncMode,
  type DemoSyncOutcome,
} from "@/lib/demo-calendar-sync";

const demoDataDirectory = path.join(process.cwd(), "data");
const sourcesFilePath = path.join(demoDataDirectory, "demo-ical-sources.json");
const mappingsFilePath = path.join(demoDataDirectory, "demo-channel-mappings.json");
const logsFilePath = path.join(demoDataDirectory, "demo-sync-logs.json");

export class DemoCalendarSyncStoreError extends Error {}

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

export async function getDemoIcalSources() {
  const sources = await readJsonFile(sourcesFilePath, seedDemoIcalSources);
  return sources.sort((left, right) => right.lastSyncedAt.localeCompare(left.lastSyncedAt));
}

export async function getDemoChannelMappings() {
  const mappings = await readJsonFile(mappingsFilePath, seedDemoChannelMappings);
  return mappings.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getDemoSyncLogs() {
  const logs = await readJsonFile(logsFilePath, seedDemoSyncLogs);
  return logs.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function updateDemoIcalSource(
  sourceId: string,
  input: {
    active?: boolean;
    status?: DemoCalendarSourceStatus;
  },
) {
  const sources = await getDemoIcalSources();
  const sourceIndex = sources.findIndex((source) => source.id === sourceId);

  if (sourceIndex === -1) {
    throw new DemoCalendarSyncStoreError("iCal kaynagi bulunamadi.");
  }

  sources[sourceIndex] = {
    ...sources[sourceIndex],
    ...(input.active !== undefined ? { active: input.active } : {}),
    ...(input.status ? { status: input.status } : {}),
  };

  await writeJsonFile(sourcesFilePath, sources);
  return sources[sourceIndex];
}

export async function runDemoCalendarSync(sourceId: string) {
  const [sources, logs] = await Promise.all([getDemoIcalSources(), getDemoSyncLogs()]);
  const sourceIndex = sources.findIndex((source) => source.id === sourceId);

  if (sourceIndex === -1) {
    throw new DemoCalendarSyncStoreError("Senkron baslatilacak kaynak bulunamadi.");
  }

  const source = sources[sourceIndex];
  const createdAt = new Date().toISOString();
  const outcome: DemoSyncOutcome =
    source.status === "ERROR" ? "WARNING" : source.status === "WARNING" ? "SUCCESS" : "SUCCESS";
  const nextStatus: DemoCalendarSourceStatus = outcome === "SUCCESS" ? "HEALTHY" : "WARNING";
  const eventCount = source.direction === "IMPORT" ? 2 : 1;
  const message =
    source.direction === "IMPORT"
      ? "Kanal takvimindeki yeni bloklar iceri aktariildi ve kontrol tamamlandi."
      : "Dis kanal icin guncel export linki tekrar yayinlandi.";

  sources[sourceIndex] = {
    ...source,
    status: nextStatus,
    lastSyncedAt: createdAt,
  };

  const log: DemoSyncLogRecord = {
    id: `sync-log-${randomUUID().slice(0, 8)}`,
    sourceId: source.id,
    villaSlug: source.villaSlug,
    villaTitle: source.villaTitle,
    channelName: source.channelName,
    outcome,
    eventCount,
    message,
    createdAt,
  };

  logs.unshift(log);

  await Promise.all([
    writeJsonFile(sourcesFilePath, sources),
    writeJsonFile(logsFilePath, logs),
  ]);

  return {
    source: sources[sourceIndex],
    log,
  };
}

export async function updateDemoChannelMapping(
  mappingId: string,
  input: {
    active?: boolean;
    syncMode?: DemoSyncMode;
  },
) {
  const mappings = await getDemoChannelMappings();
  const mappingIndex = mappings.findIndex((mapping) => mapping.id === mappingId);

  if (mappingIndex === -1) {
    throw new DemoCalendarSyncStoreError("Kanal eslestirmesi bulunamadi.");
  }

  mappings[mappingIndex] = {
    ...mappings[mappingIndex],
    ...(input.active !== undefined ? { active: input.active } : {}),
    ...(input.syncMode ? { syncMode: input.syncMode } : {}),
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(mappingsFilePath, mappings);
  return mappings[mappingIndex];
}
