import "server-only";

import { db } from "@/lib/db";
import type {
  DemoDocumentLinkStatus,
  DemoExternalServiceStatus,
  DemoShortcutStatus,
} from "@/lib/demo-external-links";
import { assertPanelCompanyAccess, resolvePanelCompanyId } from "@/lib/server/demo-company-context";
import {
  getDefaultCompanyId,
  iso,
  mapDemoExternalServiceStatusToPrisma,
  mapDemoShortcutStatusToPrisma,
  mapExternalServiceStatusToDemo,
  mapShortcutStatusToDemo,
} from "@/lib/server/prisma-demo-shared";

export class DemoExternalLinksStoreError extends Error {}

async function resolveExternalLinksCompanyId() {
  return (await resolvePanelCompanyId()) ?? (await getDefaultCompanyId());
}

function mapDocumentLinkStatus(status: "ACTIVE" | "DRAFT" | "ARCHIVED"): DemoDocumentLinkStatus {
  return status;
}

export async function getDemoShortcuts() {
  const companyId = await resolveExternalLinksCompanyId();

  if (!companyId) {
    return [];
  }

  const shortcuts = await db.shortcutLink.findMany({
    where: { companyId },
    orderBy: { title: "asc" },
  });

  return shortcuts.map((shortcut) => ({
    id: shortcut.id,
    title: shortcut.title,
    url: shortcut.url,
    category: shortcut.category,
    description: shortcut.description ?? "",
    status: mapShortcutStatusToDemo(shortcut.status),
    updatedAt: iso(shortcut.updatedAt),
  }));
}

export async function getDemoExternalServices() {
  const companyId = await resolveExternalLinksCompanyId();

  if (!companyId) {
    return [];
  }

  const services = await db.externalService.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  return services.map((service) => ({
    id: service.id,
    name: service.name,
    url: service.url,
    ownerLabel: service.ownerLabel,
    category: service.category,
    status: mapExternalServiceStatusToDemo(service.status),
    note: service.note ?? "",
    updatedAt: iso(service.updatedAt),
  }));
}

export async function getDemoDocumentLinks() {
  const companyId = await resolveExternalLinksCompanyId();

  if (!companyId) {
    return [];
  }

  const links = await db.documentLink.findMany({
    where: { companyId },
    orderBy: { title: "asc" },
  });

  return links.map((link) => ({
    id: link.id,
    title: link.title,
    url: link.url,
    category: link.category,
    status: mapDocumentLinkStatus(link.status),
    updatedAt: iso(link.updatedAt),
  }));
}

export async function updateDemoShortcutStatus(shortcutId: string, status: DemoShortcutStatus) {
  const shortcut = await db.shortcutLink.findUnique({
    where: { id: shortcutId },
  });

  if (!shortcut) {
    throw new DemoExternalLinksStoreError("Kisayol bulunamadi.");
  }

  await assertPanelCompanyAccess(shortcut.companyId);

  const updated = await db.shortcutLink.update({
    where: { id: shortcutId },
    data: {
      status: mapDemoShortcutStatusToPrisma(status),
    },
  });

  return {
    id: updated.id,
    title: updated.title,
    url: updated.url,
    category: updated.category,
    description: updated.description ?? "",
    status: mapShortcutStatusToDemo(updated.status),
    updatedAt: iso(updated.updatedAt),
  };
}

export async function updateDemoExternalServiceStatus(
  serviceId: string,
  status: DemoExternalServiceStatus,
) {
  const service = await db.externalService.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    throw new DemoExternalLinksStoreError("Dis servis kaydi bulunamadi.");
  }

  await assertPanelCompanyAccess(service.companyId);

  const updated = await db.externalService.update({
    where: { id: serviceId },
    data: {
      status: mapDemoExternalServiceStatusToPrisma(status),
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    url: updated.url,
    ownerLabel: updated.ownerLabel,
    category: updated.category,
    status: mapExternalServiceStatusToDemo(updated.status),
    note: updated.note ?? "",
    updatedAt: iso(updated.updatedAt),
  };
}

export async function updateDemoDocumentLinkStatus(
  documentLinkId: string,
  status: DemoDocumentLinkStatus,
) {
  const link = await db.documentLink.findUnique({
    where: { id: documentLinkId },
  });

  if (!link) {
    throw new DemoExternalLinksStoreError("Dokuman baglantisi bulunamadi.");
  }

  await assertPanelCompanyAccess(link.companyId);

  const updated = await db.documentLink.update({
    where: { id: documentLinkId },
    data: { status },
  });

  return {
    id: updated.id,
    title: updated.title,
    url: updated.url,
    category: updated.category,
    status: mapDocumentLinkStatus(updated.status),
    updatedAt: iso(updated.updatedAt),
  };
}
