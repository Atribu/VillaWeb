import "server-only";

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildCrmOverview,
  buildDemoCustomers,
  seedDemoReviews,
  type DemoReviewRecord,
  type DemoReviewStatus,
} from "@/lib/demo-crm";
import {
  getDemoCoupons,
  getDemoDiscountCampaigns,
  getDemoRequests,
  DemoOperationsStoreError,
} from "@/lib/server/demo-operations-store";

const demoDataDirectory = path.join(process.cwd(), "data");
const reviewFilePath = path.join(demoDataDirectory, "demo-reviews.json");

async function ensureReviewFile() {
  await mkdir(demoDataDirectory, { recursive: true });

  try {
    await access(reviewFilePath);
  } catch {
    await writeFile(reviewFilePath, JSON.stringify(seedDemoReviews, null, 2), "utf8");
  }
}

async function readReviews() {
  await ensureReviewFile();
  const raw = await readFile(reviewFilePath, "utf8");
  return JSON.parse(raw) as DemoReviewRecord[];
}

async function writeReviews(reviews: DemoReviewRecord[]) {
  await writeFile(reviewFilePath, JSON.stringify(reviews, null, 2), "utf8");
}

export async function getDemoCustomers() {
  const requests = await getDemoRequests();
  return buildDemoCustomers(requests);
}

export async function getDemoReviews() {
  const reviews = await readReviews();
  return reviews.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function updateDemoReviewStatus(reviewId: string, status: DemoReviewStatus) {
  const reviews = await getDemoReviews();
  const reviewIndex = reviews.findIndex((review) => review.id === reviewId);

  if (reviewIndex === -1) {
    throw new DemoOperationsStoreError("Yorum bulunamadi.");
  }

  reviews[reviewIndex] = {
    ...reviews[reviewIndex],
    status,
  };

  await writeReviews(reviews);

  return reviews[reviewIndex];
}

export async function getDemoCrmOverview() {
  const [requests, coupons, discounts, reviews] = await Promise.all([
    getDemoRequests(),
    getDemoCoupons(),
    getDemoDiscountCampaigns(),
    getDemoReviews(),
  ]);

  return buildCrmOverview({
    requests,
    coupons,
    discounts,
    reviews,
  });
}
