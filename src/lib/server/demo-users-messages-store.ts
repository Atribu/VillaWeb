import "server-only";

import { randomUUID, scryptSync } from "node:crypto";
import { db } from "@/lib/db";
import type {
  DemoAgencyStatus,
  DemoBranchStatus,
  DemoCommissionRateRecord,
  DemoMessageStatus,
  DemoRoleId,
  DemoTeamUserStatus,
} from "@/lib/demo-users-messages";
import { buildDemoRoles, buildUsersMessagesOverview } from "@/lib/demo-users-messages";
import {
  assertPanelCompanyAccess,
  resolvePanelCompanyId,
} from "@/lib/server/demo-company-context";
import {
  decimalToNumber,
  getDefaultCompanyId,
  iso,
  mapDemoRoleToMembershipRole,
  mapDemoUserStatusToMembershipStatus,
  mapMembershipRoleToDemoRole,
  mapMembershipStatusToDemoStatus,
  mapMessageStatusToDemo,
} from "@/lib/server/prisma-demo-shared";
import {
  createFallbackTeamUser,
  getFallbackAgencies,
  getFallbackBranches,
  getFallbackCommissionRates,
  getFallbackInternalMessages,
  getFallbackTeamUsers,
  updateFallbackTeamUser,
} from "@/lib/server/development-fallback-data";
import { withDevelopmentFallback } from "@/lib/server/development-fallback";

export class DemoUsersMessagesStoreError extends Error {}

function buildPasswordHash(password: string, saltSeed: string) {
  const salt = `${saltSeed}:${randomUUID().slice(0, 8)}`;
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

async function resolveUsersMessagesCompanyId() {
  return (await resolvePanelCompanyId()) ?? (await getDefaultCompanyId());
}

function mapCommissionScopeType(scopeType: "AGENCY" | "BRANCH" | "USER" | "WEB_DIRECT") {
  if (scopeType === "USER") {
    return "STAFF" as const;
  }

  return scopeType;
}

async function getUsersMessagesSnapshot(companyId?: string | null) {
  const [agencies, branches, memberships, messages, commissions, requests] = await Promise.all([
    db.agency.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { name: "asc" },
    }),
    db.branch.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        agency: true,
      },
      orderBy: { name: "asc" },
    }),
    db.companyMembership.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        user: true,
        branch: {
          include: {
            agency: true,
          },
        },
      },
      orderBy: [{ companyId: "asc" }, { createdAt: "asc" }],
    }),
    db.internalMessage.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        senderUser: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.commissionRule.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { updatedAt: "desc" },
    }),
    db.bookingRequest.findMany({
      where: companyId ? { companyId } : undefined,
      select: {
        companyId: true,
        assignedToUserId: true,
        status: true,
        quotedTotalAmount: true,
      },
    }),
  ]);

  const membershipByUserId = new Map(
    memberships.map((membership) => [membership.userId, membership]),
  );

  const branchStats = new Map<
    string,
    {
      requestCount: number;
      approvedRevenue: number;
      openPipeline: number;
    }
  >();

  const pipelineStatuses = new Set(["NEW", "CONTACTED", "OFFER_SENT"]);

  for (const request of requests) {
    const requestMembership =
      membershipByUserId.get(request.assignedToUserId ?? "") ??
      memberships.find((membership) => membership.companyId === request.companyId) ??
      null;
    const branchId = requestMembership?.branchId ?? null;

    if (!branchId) {
      continue;
    }

    const current = branchStats.get(branchId) ?? {
      requestCount: 0,
      approvedRevenue: 0,
      openPipeline: 0,
    };

    current.requestCount += 1;
    const totalAmount = decimalToNumber(request.quotedTotalAmount);

    if (request.status === "APPROVED") {
      current.approvedRevenue += totalAmount;
    }

    if (pipelineStatuses.has(request.status)) {
      current.openPipeline += totalAmount;
    }

    branchStats.set(branchId, current);
  }

  const branchUserCounts = new Map<string, number>();

  for (const membership of memberships) {
    if (!membership.branchId || membership.status === "SUSPENDED") {
      continue;
    }

    branchUserCounts.set(
      membership.branchId,
      (branchUserCounts.get(membership.branchId) ?? 0) + 1,
    );
  }

  const agencyStats = new Map<
    string,
    {
      requestCount: number;
      approvedRevenue: number;
      openPipeline: number;
    }
  >();

  for (const branch of branches) {
    if (!branch.agencyId) {
      continue;
    }

    const branchStat = branchStats.get(branch.id) ?? {
      requestCount: 0,
      approvedRevenue: 0,
      openPipeline: 0,
    };
    const current = agencyStats.get(branch.agencyId) ?? {
      requestCount: 0,
      approvedRevenue: 0,
      openPipeline: 0,
    };

    current.requestCount += branchStat.requestCount;
    current.approvedRevenue += branchStat.approvedRevenue;
    current.openPipeline += branchStat.openPipeline;
    agencyStats.set(branch.agencyId, current);
  }

  return {
    agencies,
    branches,
    memberships,
    messages,
    commissions,
    branchStats,
    branchUserCounts,
    agencyStats,
  };
}

export async function getDemoAgencies() {
  return withDevelopmentFallback(
    async () => {
      const companyId = await resolvePanelCompanyId();
      const { agencies, agencyStats } = await getUsersMessagesSnapshot(companyId);

      return agencies.map((agency) => {
        const stat = agencyStats.get(agency.id);

        return {
          id: agency.id,
          companyId: agency.companyId,
          name: agency.name,
          kind: agency.kind,
          ownerName: agency.ownerName ?? "Atanmadi",
          city: agency.city ?? "-",
          status: agency.status satisfies DemoAgencyStatus,
          requestCount: stat?.requestCount ?? 0,
          approvedRevenue: stat?.approvedRevenue ?? decimalToNumber(agency.approvedRevenue),
          openPipeline: stat?.openPipeline ?? decimalToNumber(agency.openPipeline),
          note: agency.note ?? "",
        };
      });
    },
    async () => getFallbackAgencies(await resolvePanelCompanyId()),
  );
}

export async function getDemoBranches() {
  return withDevelopmentFallback(
    async () => {
      const companyId = await resolvePanelCompanyId();
      const { branches, branchStats, branchUserCounts } = await getUsersMessagesSnapshot(companyId);

      return branches.map((branch) => {
        const stat = branchStats.get(branch.id);

        return {
          id: branch.id,
          companyId: branch.companyId,
          agencyId: branch.agencyId ?? "",
          agencyName: branch.agency?.name ?? "Bagimsiz",
          name: branch.name,
          city: branch.city ?? "-",
          phone: branch.phone ?? "-",
          status: branch.status satisfies DemoBranchStatus,
          userCount: branchUserCounts.get(branch.id) ?? 0,
          requestCount: stat?.requestCount ?? 0,
          approvedRevenue: stat?.approvedRevenue ?? 0,
        };
      });
    },
    async () => getFallbackBranches(await resolvePanelCompanyId()),
  );
}

export async function getDemoTeamUsers() {
  return withDevelopmentFallback(
    async () => {
      const companyId = await resolvePanelCompanyId();
      const { memberships } = await getUsersMessagesSnapshot(companyId);

      return memberships
        .map((membership) => ({
          id: membership.id,
          companyId: membership.companyId,
          fullName: membership.user.name,
          username: membership.user.username,
          email: membership.user.email,
          phone: membership.user.phone ?? "-",
          roleId: mapMembershipRoleToDemoRole(membership.role),
          status: mapMembershipStatusToDemoStatus(membership.status),
          agencyId: membership.branch?.agencyId ?? "",
          agencyName: membership.branch?.agency?.name ?? "Bagimsiz",
          branchId: membership.branchId ?? "",
          branchName: membership.branch?.name ?? "Atanmamis",
          responsibility: membership.responsibility ?? "Rol bazli erisim",
          lastActiveAt: iso(
            membership.lastActiveAt ?? membership.user.lastLoginAt ?? membership.updatedAt,
          ),
        }))
        .sort((left, right) => left.fullName.localeCompare(right.fullName));
    },
    async () => getFallbackTeamUsers(await resolvePanelCompanyId()),
  );
}

export async function createDemoTeamUser(input: {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  roleId: DemoRoleId;
  status: DemoTeamUserStatus;
  branchId: string;
  responsibility?: string;
}) {
  const fullName = input.fullName.trim();
  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const password = input.password.trim();
  const responsibility = input.responsibility?.trim() ?? "";

  if (!fullName || !username || !email || !phone || !password || !input.branchId) {
    throw new DemoUsersMessagesStoreError("Yeni kullanici icin tum zorunlu alanlar doldurulmalidir.");
  }

  if (!email.includes("@")) {
    throw new DemoUsersMessagesStoreError("Gecerli bir e-posta adresi girilmelidir.");
  }

  if (password.length < 8) {
    throw new DemoUsersMessagesStoreError("Gecici sifre en az 8 karakter olmalidir.");
  }

  return withDevelopmentFallback(
    async () => {
      const [branch, existingUser] = await Promise.all([
        db.branch.findUnique({
          where: { id: input.branchId },
          select: { id: true, companyId: true },
        }),
        db.user.findFirst({
          where: {
            OR: [{ username }, { email }],
          },
          select: { id: true, username: true, email: true },
        }),
      ]);

      if (!branch) {
        throw new DemoUsersMessagesStoreError("Kullanici icin gecerli bir sube secilmelidir.");
      }

      await assertPanelCompanyAccess(branch.companyId);

      if (existingUser) {
        throw new DemoUsersMessagesStoreError("Bu kullanici adi veya e-posta zaten kullanimda.");
      }

      const companyId = branch.companyId ?? (await resolveUsersMessagesCompanyId());

      if (!companyId) {
        throw new DemoUsersMessagesStoreError("Kullanici icin aktif firma bulunamadi.");
      }

      const now = new Date();

      const created = await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            username,
            email,
            name: fullName,
            phone,
            passwordHash: buildPasswordHash(password, username),
            platformRole: "COMPANY_USER",
            isActive: input.status !== "PASSIVE",
            lastLoginAt: input.status === "ACTIVE" ? now : null,
          },
        });

        const membership = await tx.companyMembership.create({
          data: {
            companyId,
            userId: user.id,
            branchId: branch.id,
            role: mapDemoRoleToMembershipRole(input.roleId),
            status: mapDemoUserStatusToMembershipStatus(input.status),
            responsibility: responsibility || "Rol bazli erisim",
            isPrimary: true,
            invitedAt: now,
            acceptedAt: input.status === "ACTIVE" ? now : null,
            lastActiveAt: input.status === "ACTIVE" ? now : null,
          },
          select: { id: true },
        });

        return membership.id;
      });

      const users = await getDemoTeamUsers();
      return users.find((user) => user.id === created) ?? null;
    },
    async () => {
      const branches = await getFallbackBranches();
      const branch = branches.find((item) => item.id === input.branchId);

      if (!branch) {
        throw new DemoUsersMessagesStoreError("Kullanici icin gecerli bir sube secilmelidir.");
      }

      await assertPanelCompanyAccess(branch.companyId);

      return createFallbackTeamUser({
        companyId: branch.companyId ?? (await resolveUsersMessagesCompanyId()),
        fullName,
        username,
        email,
        phone,
        roleId: input.roleId,
        status: input.status,
        branchId: input.branchId,
        responsibility: responsibility || "Rol bazli erisim",
      });
    },
  );
}

export async function getDemoRoles() {
  const users = await getDemoTeamUsers();
  return buildDemoRoles(users);
}

export async function getDemoInternalMessages() {
  return withDevelopmentFallback(
    async () => {
      const companyId = await resolvePanelCompanyId();
      const { messages } = await getUsersMessagesSnapshot(companyId);

      return messages.map((message) => ({
        id: message.id,
        companyId: message.companyId,
        senderName: message.senderUser?.name ?? "Sistem",
        recipientLabel: message.recipientLabel,
        subject: message.subject,
        body: message.body,
        status: mapMessageStatusToDemo(message.status),
        priority: message.priority,
        relatedModule: message.relatedModule ?? "Panel",
        createdAt: iso(message.createdAt),
      }));
    },
    async () => getFallbackInternalMessages(await resolvePanelCompanyId()),
  );
}

export async function getDemoCommissionRates() {
  return withDevelopmentFallback(
    async () => {
      const companyId = await resolvePanelCompanyId();
      const { commissions } = await getUsersMessagesSnapshot(companyId);

      return commissions.map((commission) => ({
        id: commission.id,
        companyId: commission.companyId,
        scopeType: mapCommissionScopeType(commission.scopeType),
        scopeLabel: commission.scopeLabel,
        percent: decimalToNumber(commission.percent),
        payoutRule: commission.payoutRule,
        active: commission.active,
        updatedAt: iso(commission.updatedAt),
      })) satisfies DemoCommissionRateRecord[];
    },
    async () => getFallbackCommissionRates(await resolvePanelCompanyId()),
  );
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
  const current = await db.agency.findUnique({
    where: { id: agencyId },
  });

  if (!current) {
    throw new DemoUsersMessagesStoreError("Acenta bulunamadi.");
  }

  await assertPanelCompanyAccess(current.companyId);

  const agency = await db.agency.update({
    where: { id: agencyId },
    data: { status },
  });

  const [stat] = await Promise.all([getDemoAgencies()]);
  return stat.find((item) => item.id === agency.id) ?? null;
}

export async function updateDemoBranchStatus(branchId: string, status: DemoBranchStatus) {
  const current = await db.branch.findUnique({
    where: { id: branchId },
  });

  if (!current) {
    throw new DemoUsersMessagesStoreError("Sube bulunamadi.");
  }

  await assertPanelCompanyAccess(current.companyId);

  const branch = await db.branch.update({
    where: { id: branchId },
    data: { status },
  });

  const branches = await getDemoBranches();
  return branches.find((item) => item.id === branch.id) ?? null;
}

export async function updateDemoTeamUser(
  userId: string,
  input: {
    status?: DemoTeamUserStatus;
    roleId?: DemoRoleId;
    branchId?: string;
    responsibility?: string;
  },
) {
  return withDevelopmentFallback(
    async () => {
      const membership = await db.companyMembership.findUnique({
        where: { id: userId },
      });

      if (!membership) {
        throw new DemoUsersMessagesStoreError("Kullanici bulunamadi.");
      }

      await assertPanelCompanyAccess(membership.companyId);

      let branchId: string | null | undefined = undefined;

      if (input.branchId !== undefined) {
        if (!input.branchId) {
          branchId = null;
        } else {
          const branch = await db.branch.findUnique({
            where: { id: input.branchId },
            select: { id: true, companyId: true },
          });

          if (!branch) {
            throw new DemoUsersMessagesStoreError("Secilen sube bulunamadi.");
          }

          if (branch.companyId !== membership.companyId) {
            throw new DemoUsersMessagesStoreError("Kullanici farkli bir firmanin subesine atanamaz.");
          }

          branchId = branch.id;
        }
      }

      await db.companyMembership.update({
        where: { id: userId },
        data: {
          ...(input.status ? { status: mapDemoUserStatusToMembershipStatus(input.status) } : {}),
          ...(input.roleId ? { role: mapDemoRoleToMembershipRole(input.roleId) } : {}),
          ...(branchId !== undefined ? { branchId } : {}),
          ...(input.responsibility !== undefined
            ? { responsibility: input.responsibility.trim() || "Rol bazli erisim" }
            : {}),
          ...(input.status === "ACTIVE" ? { acceptedAt: membership.acceptedAt ?? new Date() } : {}),
        },
      });

      const users = await getDemoTeamUsers();
      return users.find((user) => user.id === userId) ?? null;
    },
    async () => {
      const current = (await getFallbackTeamUsers()).find((item) => item.id === userId);

      if (!current) {
        throw new DemoUsersMessagesStoreError("Kullanici bulunamadi.");
      }

      await assertPanelCompanyAccess(current.companyId);

      return updateFallbackTeamUser(userId, {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.roleId !== undefined ? { roleId: input.roleId } : {}),
        ...(input.branchId !== undefined ? { branchId: input.branchId } : {}),
        ...(input.responsibility !== undefined ? { responsibility: input.responsibility } : {}),
      });
    },
  );
}

export async function updateDemoInternalMessageStatus(messageId: string, status: DemoMessageStatus) {
  const message = await db.internalMessage.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new DemoUsersMessagesStoreError("Mesaj bulunamadi.");
  }

  await assertPanelCompanyAccess(message.companyId);

  await db.internalMessage.update({
    where: { id: messageId },
    data: {
      status,
      resolvedAt: status === "RESOLVED" ? new Date() : status === "ARCHIVED" ? new Date() : null,
    },
  });

  const messages = await getDemoInternalMessages();
  return messages.find((item) => item.id === messageId) ?? null;
}

export async function updateDemoCommissionRate(
  commissionId: string,
  input: {
    active?: boolean;
    percent?: number;
  },
) {
  const commission = await db.commissionRule.findUnique({
    where: { id: commissionId },
  });

  if (!commission) {
    throw new DemoUsersMessagesStoreError("Komisyon kaydi bulunamadi.");
  }

  if (input.percent !== undefined && (input.percent <= 0 || input.percent >= 100)) {
    throw new DemoUsersMessagesStoreError("Komisyon orani 1 ile 99 arasinda olmalidir.");
  }

  await assertPanelCompanyAccess(commission.companyId);

  await db.commissionRule.update({
    where: { id: commissionId },
    data: {
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.percent !== undefined ? { percent: input.percent } : {}),
    },
  });

  const commissions = await getDemoCommissionRates();
  return commissions.find((item) => item.id === commissionId) ?? null;
}
