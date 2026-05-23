import "server-only";

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  seedDemoDocumentLinks,
  seedDemoExternalServices,
  seedDemoShortcuts,
  type DemoDocumentLinkStatus,
  type DemoExternalServiceStatus,
  type DemoShortcutStatus,
} from "@/lib/demo-external-links";

const demoDataDirectory = path.join(process.cwd(), "data");
const shortcutsFilePath = path.join(demoDataDirectory, "demo-shortcuts.json");
const externalServicesFilePath = path.join(demoDataDirectory, "demo-external-services.json");
const documentLinksFilePath = path.join(demoDataDirectory, "demo-document-links.json");

export class DemoExternalLinksStoreError extends Error {}

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

export async function getDemoShortcuts() {
  const shortcuts = await readJsonFile(shortcutsFilePath, seedDemoShortcuts);
  return shortcuts.sort((left, right) => left.title.localeCompare(right.title));
}

export async function getDemoExternalServices() {
  const services = await readJsonFile(externalServicesFilePath, seedDemoExternalServices);
  return services.sort((left, right) => left.name.localeCompare(right.name));
}

export async function getDemoDocumentLinks() {
  const links = await readJsonFile(documentLinksFilePath, seedDemoDocumentLinks);
  return links.sort((left, right) => left.title.localeCompare(right.title));
}

export async function updateDemoShortcutStatus(shortcutId: string, status: DemoShortcutStatus) {
  const shortcuts = await getDemoShortcuts();
  const shortcutIndex = shortcuts.findIndex((shortcut) => shortcut.id === shortcutId);

  if (shortcutIndex === -1) {
    throw new DemoExternalLinksStoreError("Kisayol bulunamadi.");
  }

  shortcuts[shortcutIndex] = {
    ...shortcuts[shortcutIndex],
    status,
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(shortcutsFilePath, shortcuts);
  return shortcuts[shortcutIndex];
}

export async function updateDemoExternalServiceStatus(
  serviceId: string,
  status: DemoExternalServiceStatus,
) {
  const services = await getDemoExternalServices();
  const serviceIndex = services.findIndex((service) => service.id === serviceId);

  if (serviceIndex === -1) {
    throw new DemoExternalLinksStoreError("Dis servis kaydi bulunamadi.");
  }

  services[serviceIndex] = {
    ...services[serviceIndex],
    status,
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(externalServicesFilePath, services);
  return services[serviceIndex];
}

export async function updateDemoDocumentLinkStatus(
  documentLinkId: string,
  status: DemoDocumentLinkStatus,
) {
  const links = await getDemoDocumentLinks();
  const linkIndex = links.findIndex((link) => link.id === documentLinkId);

  if (linkIndex === -1) {
    throw new DemoExternalLinksStoreError("Dokuman baglantisi bulunamadi.");
  }

  links[linkIndex] = {
    ...links[linkIndex],
    status,
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(documentLinksFilePath, links);
  return links[linkIndex];
}
