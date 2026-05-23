import "server-only";

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RequestOrigin, RequestStatus } from "@/lib/demo-operations";
import {
  buildDemoRoles,
  buildUsersMessagesOverview,
  seedDemoAgencies,
  seedDemoBranches,
  seedDemoCommissionRates,
  seedDemoInternalMessages,
  seedDemoTeamUsers,
  type DemoAgencyStatus,
  type DemoBranchStatus,
  type DemoMessageStatus,
  type DemoRoleId,
  type DemoTeamUserStatus,
} from "@/lib/demo-users-messages";
import { getDemoRequests } from "@/lib/server/demo-operations-store";

const demoDataDirectory = path.join(process.cwd(), "data");
const agenciesFilePath = path.join(demoDataDirectory, "demo-agencies.json");
const branchesFilePath = path.join(demoDataDirectory, "demo-branches.json");
const usersFilePath = path.join(demoDataDirectory, "demo-team-users.json");
const messagesFilePath = path.join(demoDataDirectory, "demo-internal-messages.json");
const commissionsFilePath = path.join(demoDataDirectory, "demo-commission-rates.json");

export class DemoUsersMessagesStoreError extends Error {}

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

function mapOriginToAgencyId(origin?: RequestOrigin) {
  return origin === "MANUAL_PANEL" ? "agency-merkez-rezervasyon" : "agency-direct-web";
}

function mapOriginToBranchId(origin?: RequestOrigin) {
  return origin === "MANUAL_PANEL" ? "branch-central-desk" : "branch-digital-desk";
}

function getPipelineStatuses() {
  return new Set<RequestStatus>(["NEW", "CONTACTED", "QUOTE_SENT"]);
}

async function syncAgenciesAndBranches() {
  const [agencies, branches, requests, users] = await Promise.all([
    readJsonFile(agenciesFilePath, seedDemoAgencies),
    readJsonFile(branchesFilePath, seedDemoBranches),
    getDemoRequests(),
    readJsonFile(usersFilePath, seedDemoTeamUsers),
  ]);

  const pipelineStatuses = getPipelineStatuses();

  const agencyStats = new Map<
    string,
    {
      requestCount: number;
      approvedRevenue: number;
      openPipeline: number;
    }
  >();

  for (const request of requests) {
    const agencyId = mapOriginToAgencyId(request.origin);
    const branchId = mapOriginToBranchId(request.origin);

    const agencyStat = agencyStats.get(agencyId) ?? {
      requestCount: 0,
      approvedRevenue: 0,
      openPipeline: 0,
    };
    agencyStat.requestCount += 1;
    if (request.status === "APPROVED") {
      agencyStat.approvedRevenue += request.pricing.grandTotal;
    }
    if (pipelineStatuses.has(request.status)) {
      agencyStat.openPipeline += request.pricing.grandTotal;
    }
    agencyStats.set(agencyId, agencyStat);

    const branchStat = agencyStats.get(branchId) ?? {
      requestCount: 0,
      approvedRevenue: 0,
      openPipeline: 0,
    };
    branchStat.requestCount += 1;
    if (request.status === "APPROVED") {
      branchStat.approvedRevenue += request.pricing.grandTotal;
    }
    if (pipelineStatuses.has(request.status)) {
      branchStat.openPipeline += request.pricing.grandTotal;
    }
    agencyStats.set(branchId, branchStat);
  }

  const syncedAgencies = agencies
    .map((agency) => {
      const stat = agencyStats.get(agency.id);

      if (!stat) {
        return agency;
      }

      return {
        ...agency,
        requestCount: stat.requestCount,
        approvedRevenue: stat.approvedRevenue,
        openPipeline: stat.openPipeline,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  const syncedBranches = branches
    .map((branch) => {
      const stat = agencyStats.get(branch.id);
      const userCount = users.filter((user) => user.branchId === branch.id && user.status !== "PASSIVE")
        .length;

      return {
        ...branch,
        userCount,
        requestCount: stat?.requestCount ?? branch.requestCount,
        approvedRevenue: stat?.approvedRevenue ?? branch.approvedRevenue,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  await Promise.all([
    writeJsonFile(agenciesFilePath, syncedAgencies),
    writeJsonFile(branchesFilePath, syncedBranches),
  ]);

  return {
    agencies: syncedAgencies,
    branches: syncedBranches,
  };
}

export async function getDemoAgencies() {
  const { agencies } = await syncAgenciesAndBranches();
  return agencies;
}

export async function getDemoBranches() {
  const { branches } = await syncAgenciesAndBranches();
  return branches;
}

export async function getDemoTeamUsers() {
  const users = await readJsonFile(usersFilePath, seedDemoTeamUsers);
  return users.sort((left, right) => left.fullName.localeCompare(right.fullName));
}

export async function getDemoRoles() {
  const users = await getDemoTeamUsers();
  return buildDemoRoles(users);
}

export async function getDemoInternalMessages() {
  const messages = await readJsonFile(messagesFilePath, seedDemoInternalMessages);
  return messages.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getDemoCommissionRates() {
  const commissions = await readJsonFile(commissionsFilePath, seedDemoCommissionRates);
  return commissions.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getDemoUsersMessagesOverview() {
  const [agencies, branches, users, messages, commissions] = await Promise.all([
    getDemoAgencies(),
    getDemoBranches(),
    getDemoTeamUsers(),
    getDemoInternalMessages(),
    getDemoCommissionRates(),
  ]);

  return buildUsersMessagesOverview({
    agencies,
    branches,
    users,
    messages,
    commissions,
  });
}

export async function updateDemoAgencyStatus(agencyId: string, status: DemoAgencyStatus) {
  const agencies = await getDemoAgencies();
  const agencyIndex = agencies.findIndex((agency) => agency.id === agencyId);

  if (agencyIndex === -1) {
    throw new DemoUsersMessagesStoreError("Acenta bulunamadi.");
  }

  agencies[agencyIndex] = {
    ...agencies[agencyIndex],
    status,
  };

  await writeJsonFile(agenciesFilePath, agencies);
  return agencies[agencyIndex];
}

export async function updateDemoBranchStatus(branchId: string, status: DemoBranchStatus) {
  const branches = await getDemoBranches();
  const branchIndex = branches.findIndex((branch) => branch.id === branchId);

  if (branchIndex === -1) {
    throw new DemoUsersMessagesStoreError("Sube bulunamadi.");
  }

  branches[branchIndex] = {
    ...branches[branchIndex],
    status,
  };

  await writeJsonFile(branchesFilePath, branches);
  return branches[branchIndex];
}

export async function updateDemoTeamUser(
  userId: string,
  input: {
    status?: DemoTeamUserStatus;
    roleId?: DemoRoleId;
  },
) {
  const users = await getDemoTeamUsers();
  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    throw new DemoUsersMessagesStoreError("Kullanici bulunamadi.");
  }

  users[userIndex] = {
    ...users[userIndex],
    ...(input.status ? { status: input.status } : {}),
    ...(input.roleId ? { roleId: input.roleId } : {}),
  };

  await writeJsonFile(usersFilePath, users);
  return users[userIndex];
}

export async function updateDemoInternalMessageStatus(messageId: string, status: DemoMessageStatus) {
  const messages = await getDemoInternalMessages();
  const messageIndex = messages.findIndex((message) => message.id === messageId);

  if (messageIndex === -1) {
    throw new DemoUsersMessagesStoreError("Mesaj bulunamadi.");
  }

  messages[messageIndex] = {
    ...messages[messageIndex],
    status,
  };

  await writeJsonFile(messagesFilePath, messages);
  return messages[messageIndex];
}

export async function updateDemoCommissionRate(
  commissionId: string,
  input: {
    active?: boolean;
    percent?: number;
  },
) {
  const commissions = await getDemoCommissionRates();
  const commissionIndex = commissions.findIndex((commission) => commission.id === commissionId);

  if (commissionIndex === -1) {
    throw new DemoUsersMessagesStoreError("Komisyon kaydi bulunamadi.");
  }

  if (input.percent !== undefined && (input.percent <= 0 || input.percent >= 100)) {
    throw new DemoUsersMessagesStoreError("Komisyon orani 1 ile 99 arasinda olmalidir.");
  }

  commissions[commissionIndex] = {
    ...commissions[commissionIndex],
    ...(input.active !== undefined ? { active: input.active } : {}),
    ...(input.percent !== undefined ? { percent: input.percent } : {}),
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(commissionsFilePath, commissions);
  return commissions[commissionIndex];
}
