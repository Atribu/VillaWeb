import "server-only";

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import type {
  DemoCalendarSourceStatus,
  DemoSyncMode,
  DemoSyncOutcome,
} from "@/lib/demo-calendar-sync";
import { assertPanelCompanyAccess, resolvePanelCompanyId } from "@/lib/server/demo-company-context";
import {
  iso,
  mapCalendarSourceStatusToDemo,
  mapDemoCalendarSourceStatusToPrisma,
  mapDemoSyncModeToPrisma,
  mapSyncModeToDemo,
  mapSyncOutcomeToDemo,
} from "@/lib/server/prisma-demo-shared";

export class DemoCalendarSyncStoreError extends Error {}

export async function getDemoIcalSources() {
  const companyId = await resolvePanelCompanyId();

  const sources = await db.calendarSyncSource.findMany({
    where: companyId ? { companyId } : undefined,
    include: {
      villa: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
    orderBy: [{ lastSyncedAt: "desc" }, { updatedAt: "desc" }],
  });

  return sources.map((source) => ({
    id: source.id,
    companyId: source.companyId,
    villaSlug: source.villa.slug,
    villaTitle: source.villa.title,
    channelName: source.channelName,
    sourceUrl: source.sourceUrl,
    direction: source.direction,
    active: source.active,
    status: mapCalendarSourceStatusToDemo(source.status),
    lastSyncedAt: iso(source.lastSyncedAt),
  }));
}

export async function getDemoChannelMappings() {
  const companyId = await resolvePanelCompanyId();

  const mappings = await db.calendarSyncMapping.findMany({
    where: companyId ? { companyId } : undefined,
    include: {
      villa: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return mappings.map((mapping) => ({
    id: mapping.id,
    companyId: mapping.companyId,
    villaSlug: mapping.villa.slug,
    villaTitle: mapping.villa.title,
    channelName: mapping.channelName,
    remoteCalendarName: mapping.remoteCalendarName,
    syncMode: mapSyncModeToDemo(mapping.syncMode),
    active: mapping.active,
    updatedAt: iso(mapping.updatedAt),
  }));
}

export async function getDemoSyncLogs() {
  const companyId = await resolvePanelCompanyId();

  const logs = await db.calendarSyncLog.findMany({
    where: companyId ? { companyId } : undefined,
    include: {
      villa: {
        select: {
          slug: true,
          title: true,
        },
      },
      source: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return logs.map((log) => ({
    id: log.id,
    companyId: log.companyId,
    sourceId: log.source?.id ?? "",
    villaSlug: log.villa.slug,
    villaTitle: log.villa.title,
    channelName: log.channelName,
    outcome: mapSyncOutcomeToDemo(log.outcome),
    eventCount: log.eventCount,
    message: log.message,
    createdAt: iso(log.createdAt),
  }));
}

export async function updateDemoIcalSource(
  sourceId: string,
  input: {
    active?: boolean;
    status?: DemoCalendarSourceStatus;
  },
) {
  const current = await db.calendarSyncSource.findUnique({
    where: { id: sourceId },
    include: {
      villa: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
  });

  if (!current) {
    throw new DemoCalendarSyncStoreError("iCal kaynagi bulunamadi.");
  }

  await assertPanelCompanyAccess(current.companyId);

  const source = await db.calendarSyncSource.update({
    where: { id: sourceId },
    data: {
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.status ? { status: mapDemoCalendarSourceStatusToPrisma(input.status) } : {}),
    },
    include: {
      villa: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
  });

  return {
    id: source.id,
    companyId: source.companyId,
    villaSlug: source.villa.slug,
    villaTitle: source.villa.title,
    channelName: source.channelName,
    sourceUrl: source.sourceUrl,
    direction: source.direction,
    active: source.active,
    status: mapCalendarSourceStatusToDemo(source.status),
    lastSyncedAt: iso(source.lastSyncedAt),
  };
}

export async function runDemoCalendarSync(sourceId: string) {
  const source = await db.calendarSyncSource.findUnique({
    where: { id: sourceId },
    include: {
      villa: {
        select: {
          id: true,
          slug: true,
          title: true,
        },
      },
    },
  });

  if (!source) {
    throw new DemoCalendarSyncStoreError("Senkron baslatilacak kaynak bulunamadi.");
  }

  await assertPanelCompanyAccess(source.companyId);

  const createdAt = new Date();
  const outcome: DemoSyncOutcome = source.status === "ERROR" ? "WARNING" : "SUCCESS";
  const nextStatus: DemoCalendarSourceStatus = outcome === "SUCCESS" ? "HEALTHY" : "WARNING";
  const eventCount = source.direction === "IMPORT" ? 2 : 1;
  const message =
    source.direction === "IMPORT"
      ? "Kanal takvimindeki yeni bloklar iceri aktariildi ve kontrol tamamlandi."
      : "Dis kanal icin guncel export linki tekrar yayinlandi.";

  const [updatedSource, log] = await db.$transaction([
    db.calendarSyncSource.update({
      where: { id: sourceId },
      data: {
        status: mapDemoCalendarSourceStatusToPrisma(nextStatus),
        lastSyncedAt: createdAt,
      },
      include: {
        villa: {
          select: {
            slug: true,
            title: true,
          },
        },
      },
    }),
    db.calendarSyncLog.create({
      data: {
        id: `sync-log-${randomUUID().slice(0, 8)}`,
        companyId: source.companyId,
        sourceId: source.id,
        villaId: source.villa.id,
        channelName: source.channelName,
        outcome,
        eventCount,
        message,
        createdAt,
      },
      include: {
        villa: {
          select: {
            slug: true,
            title: true,
          },
        },
        source: {
          select: { id: true },
        },
      },
    }),
  ]);

  return {
    source: {
      id: updatedSource.id,
      companyId: updatedSource.companyId,
      villaSlug: updatedSource.villa.slug,
      villaTitle: updatedSource.villa.title,
      channelName: updatedSource.channelName,
      sourceUrl: updatedSource.sourceUrl,
      direction: updatedSource.direction,
      active: updatedSource.active,
      status: mapCalendarSourceStatusToDemo(updatedSource.status),
      lastSyncedAt: iso(updatedSource.lastSyncedAt),
    },
    log: {
      id: log.id,
      companyId: log.companyId,
      sourceId: log.source?.id ?? "",
      villaSlug: log.villa.slug,
      villaTitle: log.villa.title,
      channelName: log.channelName,
      outcome: mapSyncOutcomeToDemo(log.outcome),
      eventCount: log.eventCount,
      message: log.message,
      createdAt: iso(log.createdAt),
    },
  };
}

export async function updateDemoChannelMapping(
  mappingId: string,
  input: {
    active?: boolean;
    syncMode?: DemoSyncMode;
  },
) {
  const current = await db.calendarSyncMapping.findUnique({
    where: { id: mappingId },
    include: {
      villa: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
  });

  if (!current) {
    throw new DemoCalendarSyncStoreError("Kanal eslestirmesi bulunamadi.");
  }

  await assertPanelCompanyAccess(current.companyId);

  const mapping = await db.calendarSyncMapping.update({
    where: { id: mappingId },
    data: {
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.syncMode ? { syncMode: mapDemoSyncModeToPrisma(input.syncMode) } : {}),
    },
    include: {
      villa: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
  });

  return {
    id: mapping.id,
    companyId: mapping.companyId,
    villaSlug: mapping.villa.slug,
    villaTitle: mapping.villa.title,
    channelName: mapping.channelName,
    remoteCalendarName: mapping.remoteCalendarName,
    syncMode: mapSyncModeToDemo(mapping.syncMode),
    active: mapping.active,
    updatedAt: iso(mapping.updatedAt),
  };
}
