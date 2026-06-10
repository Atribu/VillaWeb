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
  createFallbackChannelMapping,
  createFallbackIcalSource,
  getFallbackChannelMappings,
  getFallbackIcalSources,
  getFallbackSyncLogs,
  getFallbackVillas,
  runFallbackCalendarSync,
  updateFallbackChannelMapping,
  updateFallbackIcalSource,
} from "@/lib/server/development-fallback-data";
import { withDevelopmentFallback } from "@/lib/server/development-fallback";
import {
  iso,
  mapCalendarSourceStatusToDemo,
  mapDemoCalendarSourceStatusToPrisma,
  mapDemoSyncModeToPrisma,
  mapSyncModeToDemo,
  mapSyncOutcomeToDemo,
} from "@/lib/server/prisma-demo-shared";

export class DemoCalendarSyncStoreError extends Error {}

function validateCalendarUrl(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new DemoCalendarSyncStoreError("Takvim baglantisi bos birakilamaz.");
  }

  try {
    const url = new URL(normalized);

    if (!["http:", "https:", "webcal:"].includes(url.protocol)) {
      throw new Error("unsupported");
    }

    return normalized;
  } catch {
    throw new DemoCalendarSyncStoreError("Gecerli bir iCal baglantisi girilmelidir.");
  }
}

export async function getDemoIcalSources() {
  return withDevelopmentFallback(
    async () => {
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
    },
    async () => getFallbackIcalSources(await resolvePanelCompanyId()),
  );
}

export async function createDemoIcalSource(input: {
  villaId: string;
  channelName: string;
  sourceUrl: string;
  direction: "IMPORT" | "EXPORT";
}) {
  const channelName = input.channelName.trim();
  const sourceUrl = validateCalendarUrl(input.sourceUrl);

  if (!input.villaId || !channelName) {
    throw new DemoCalendarSyncStoreError("Kaynak olusturmak icin villa ve kanal bilgisi zorunludur.");
  }

  return withDevelopmentFallback(
    async () => {
      const villa = await db.villa.findUnique({
        where: { id: input.villaId },
        select: {
          id: true,
          companyId: true,
          slug: true,
          title: true,
        },
      });

      if (!villa) {
        throw new DemoCalendarSyncStoreError("Takvim kaynagi icin secilen villa bulunamadi.");
      }

      await assertPanelCompanyAccess(villa.companyId);

      const existing = await db.calendarSyncSource.findFirst({
        where: {
          companyId: villa.companyId,
          villaId: villa.id,
          channelName,
          direction: input.direction,
        },
        select: { id: true },
      });

      if (existing) {
        throw new DemoCalendarSyncStoreError(
          "Bu villa ve kanal icin ayni yonlu bir iCal kaynagi zaten var.",
        );
      }

      const source = await db.calendarSyncSource.create({
        data: {
          companyId: villa.companyId,
          villaId: villa.id,
          channelName,
          sourceUrl,
          direction: input.direction,
          active: true,
          status: "HEALTHY",
          lastSyncedAt: null,
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
    },
    async () => {
      const villa = (await getFallbackVillas()).find((item) => item.id === input.villaId);

      if (!villa) {
        throw new DemoCalendarSyncStoreError("Takvim kaynagi icin secilen villa bulunamadi.");
      }

      await assertPanelCompanyAccess(villa.companyId);
      return createFallbackIcalSource({
        villaId: input.villaId,
        channelName,
        sourceUrl,
        direction: input.direction,
      });
    },
  );
}

export async function getDemoChannelMappings() {
  return withDevelopmentFallback(
    async () => {
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
    },
    async () => getFallbackChannelMappings(await resolvePanelCompanyId()),
  );
}

export async function getDemoSyncLogs() {
  return withDevelopmentFallback(
    async () => {
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
    },
    async () => getFallbackSyncLogs(await resolvePanelCompanyId()),
  );
}

export async function updateDemoIcalSource(
  sourceId: string,
  input: {
    active?: boolean;
    status?: DemoCalendarSourceStatus;
    sourceUrl?: string;
  },
) {
  const nextSourceUrl = input.sourceUrl !== undefined ? validateCalendarUrl(input.sourceUrl) : undefined;

  return withDevelopmentFallback(
    async () => {
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
          ...(nextSourceUrl !== undefined ? { sourceUrl: nextSourceUrl } : {}),
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
    },
    async () => {
      const current = (await getFallbackIcalSources()).find((item) => item.id === sourceId);

      if (!current) {
        throw new DemoCalendarSyncStoreError("iCal kaynagi bulunamadi.");
      }

      await assertPanelCompanyAccess(current.companyId);
      return updateFallbackIcalSource(sourceId, {
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(nextSourceUrl !== undefined ? { sourceUrl: nextSourceUrl } : {}),
      });
    },
  );
}

export async function runDemoCalendarSync(sourceId: string) {
  return withDevelopmentFallback(
    async () => {
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
    },
    async () => {
      const source = (await getFallbackIcalSources()).find((item) => item.id === sourceId);

      if (!source) {
        throw new DemoCalendarSyncStoreError("Senkron baslatilacak kaynak bulunamadi.");
      }

      await assertPanelCompanyAccess(source.companyId);
      return runFallbackCalendarSync(sourceId);
    },
  );
}

export async function updateDemoChannelMapping(
  mappingId: string,
  input: {
    active?: boolean;
    syncMode?: DemoSyncMode;
    remoteCalendarName?: string;
  },
) {
  const remoteCalendarName = input.remoteCalendarName?.trim();

  if (remoteCalendarName !== undefined && !remoteCalendarName) {
    throw new DemoCalendarSyncStoreError("Uzak takvim adi bos birakilamaz.");
  }

  return withDevelopmentFallback(
    async () => {
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
          ...(remoteCalendarName !== undefined ? { remoteCalendarName } : {}),
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
    },
    async () => {
      const current = (await getFallbackChannelMappings()).find((item) => item.id === mappingId);

      if (!current) {
        throw new DemoCalendarSyncStoreError("Kanal eslestirmesi bulunamadi.");
      }

      await assertPanelCompanyAccess(current.companyId);
      return updateFallbackChannelMapping(mappingId, {
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.syncMode !== undefined ? { syncMode: input.syncMode } : {}),
        ...(remoteCalendarName !== undefined ? { remoteCalendarName } : {}),
      });
    },
  );
}

export async function createDemoChannelMapping(input: {
  villaId: string;
  channelName: string;
  remoteCalendarName: string;
  syncMode: DemoSyncMode;
}) {
  const channelName = input.channelName.trim();
  const remoteCalendarName = input.remoteCalendarName.trim();

  if (!input.villaId || !channelName || !remoteCalendarName) {
    throw new DemoCalendarSyncStoreError("Eslestirme icin tum zorunlu alanlar doldurulmalidir.");
  }

  return withDevelopmentFallback(
    async () => {
      const villa = await db.villa.findUnique({
        where: { id: input.villaId },
        select: {
          id: true,
          companyId: true,
          slug: true,
          title: true,
        },
      });

      if (!villa) {
        throw new DemoCalendarSyncStoreError("Eslestirme icin secilen villa bulunamadi.");
      }

      await assertPanelCompanyAccess(villa.companyId);

      const existing = await db.calendarSyncMapping.findFirst({
        where: {
          companyId: villa.companyId,
          villaId: villa.id,
          channelName,
        },
        select: { id: true },
      });

      if (existing) {
        throw new DemoCalendarSyncStoreError("Bu villa ve kanal icin eslestirme zaten tanimli.");
      }

      const mapping = await db.calendarSyncMapping.create({
        data: {
          companyId: villa.companyId,
          villaId: villa.id,
          channelName,
          remoteCalendarName,
          syncMode: mapDemoSyncModeToPrisma(input.syncMode),
          active: true,
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
    },
    async () => {
      const villa = (await getFallbackVillas()).find((item) => item.id === input.villaId);

      if (!villa) {
        throw new DemoCalendarSyncStoreError("Eslestirme icin secilen villa bulunamadi.");
      }

      await assertPanelCompanyAccess(villa.companyId);
      return createFallbackChannelMapping({
        villaId: input.villaId,
        channelName,
        remoteCalendarName,
        syncMode: input.syncMode,
      });
    },
  );
}
