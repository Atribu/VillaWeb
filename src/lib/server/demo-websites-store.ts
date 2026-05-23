import "server-only";

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  seedDemoLandingPages,
  seedDemoSeoContents,
  seedDemoWebsites,
  type DemoLandingStatus,
  type DemoSeoContentStatus,
  type DemoWebsiteStatus,
} from "@/lib/demo-websites";

const demoDataDirectory = path.join(process.cwd(), "data");
const websitesFilePath = path.join(demoDataDirectory, "demo-websites.json");
const landingsFilePath = path.join(demoDataDirectory, "demo-landing-pages.json");
const seoContentsFilePath = path.join(demoDataDirectory, "demo-seo-contents.json");

export class DemoWebsitesStoreError extends Error {}

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

export async function getDemoWebsites() {
  const websites = await readJsonFile(websitesFilePath, seedDemoWebsites);
  return websites.sort((left, right) => left.name.localeCompare(right.name));
}

export async function getDemoLandingPages() {
  const landings = await readJsonFile(landingsFilePath, seedDemoLandingPages);
  return landings.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getDemoSeoContents() {
  const contents = await readJsonFile(seoContentsFilePath, seedDemoSeoContents);
  return contents.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function updateDemoWebsite(
  websiteId: string,
  input: {
    status?: DemoWebsiteStatus;
    default?: boolean;
  },
) {
  const websites = await getDemoWebsites();
  const websiteIndex = websites.findIndex((website) => website.id === websiteId);

  if (websiteIndex === -1) {
    throw new DemoWebsitesStoreError("Site kaydi bulunamadi.");
  }

  let nextWebsites = websites.map((website) => ({ ...website }));

  if (input.default) {
    nextWebsites = nextWebsites.map((website) => ({
      ...website,
      default: website.id === websiteId,
    }));
  }

  const current = nextWebsites[websiteIndex];
  nextWebsites[websiteIndex] = {
    ...current,
    ...(input.status ? { status: input.status } : {}),
    ...(input.default !== undefined ? { default: input.default } : {}),
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(websitesFilePath, nextWebsites);
  return nextWebsites[websiteIndex];
}

export async function updateDemoLandingPage(
  landingId: string,
  input: {
    status?: DemoLandingStatus;
  },
) {
  const landings = await getDemoLandingPages();
  const landingIndex = landings.findIndex((landing) => landing.id === landingId);

  if (landingIndex === -1) {
    throw new DemoWebsitesStoreError("Landing sayfasi bulunamadi.");
  }

  landings[landingIndex] = {
    ...landings[landingIndex],
    ...(input.status ? { status: input.status } : {}),
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(landingsFilePath, landings);
  return landings[landingIndex];
}

export async function updateDemoSeoContent(
  contentId: string,
  input: {
    status?: DemoSeoContentStatus;
    seoScore?: number;
  },
) {
  const contents = await getDemoSeoContents();
  const contentIndex = contents.findIndex((content) => content.id === contentId);

  if (contentIndex === -1) {
    throw new DemoWebsitesStoreError("SEO icerigi bulunamadi.");
  }

  if (input.seoScore !== undefined && (input.seoScore < 0 || input.seoScore > 100)) {
    throw new DemoWebsitesStoreError("SEO skoru 0 ile 100 arasinda olmalidir.");
  }

  contents[contentIndex] = {
    ...contents[contentIndex],
    ...(input.status ? { status: input.status } : {}),
    ...(input.seoScore !== undefined ? { seoScore: input.seoScore } : {}),
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(seoContentsFilePath, contents);
  return contents[contentIndex];
}
