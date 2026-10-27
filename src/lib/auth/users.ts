import "server-only";

import type { MembershipRole, PlatformRole } from "@prisma/client";
import { db } from "@/lib/db";
import { getAllCompanyRecords } from "@/lib/server/company-store";
import { withDevelopmentFallback } from "@/lib/server/development-fallback";
import { writeDevelopmentDataFile } from "@/lib/server/development-fallback";
import { getFallbackTeamUsers } from "@/lib/server/development-fallback-data";
import { getDevelopmentIdentity, readDevelopmentAuth, registerDevelopmentIdentity } from "@/lib/auth/development-auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { membershipAppRole, type AppRole } from "@/lib/auth/permissions";

export type { AppRole } from "@/lib/auth/permissions";

export type AppUser = {
  id: string;
  username: string;
  displayName: string;
  role: AppRole;
  companyId?: string;
  companySlug?: string;
  companyName?: string;
};

export type LoginFailureReason =
  | "INVALID_CREDENTIALS"
  | "COMPANY_REQUIRED"
  | "COMPANY_NOT_FOUND"
  | "COMPANY_ACCESS_DENIED";

export type LoginValidationResult =
  | {
      ok: true;
      user: AppUser;
    }
  | {
      ok: false;
      reason: LoginFailureReason;
    };

export const loginCredentials = [
  {
    username:
      process.env.SEED_SUPER_ADMIN_USERNAME ??
      process.env.SUPER_ADMIN_USERNAME ??
      "oguzkilinc.ant@gmail.com",
    email: process.env.SEED_SUPER_ADMIN_EMAIL ?? "oguzkilinc.ant@gmail.com",
    password:
      process.env.SEED_SUPER_ADMIN_PASSWORD ?? process.env.SUPER_ADMIN_PASSWORD ?? "qweasd11.",
    displayName: "Platform Super Admin",
    role: "SUPER_ADMIN" as const,
  },
  {
    username:
      process.env.SEED_VILLAVERA_ADMIN_USERNAME ?? process.env.ADMIN_USERNAME ?? "villavera-admin",
    password:
      process.env.SEED_VILLAVERA_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? "VillaAdmin2026!",
    displayName: "VillaVera Firma Admini",
    role: "ADMIN" as const,
    companyName: "VillaVera Collection",
  },
  {
    username:
      process.env.SEED_VILLAVERA_STAFF_USERNAME ??
      process.env.STAFF_USERNAME ??
      "villavera-personel",
    password:
      process.env.SEED_VILLAVERA_STAFF_PASSWORD ??
      process.env.STAFF_PASSWORD ??
      "VillaStaff2026!",
    displayName: "VillaVera Villa Personeli",
    role: "STAFF" as const,
    companyName: "VillaVera Collection",
  },
  {
    username: process.env.SEED_SAHIL_ADMIN_USERNAME ?? "sahil-admin",
    password: process.env.SEED_SAHIL_ADMIN_PASSWORD ?? "SahilAdmin2026!",
    displayName: "Sahil Collection Admin",
    role: "ADMIN" as const,
    companyName: "Sahil Collection Villas",
  },
  {
    username: process.env.SEED_SAHIL_FINANCE_USERNAME ?? "sahil-finance",
    password: process.env.SEED_SAHIL_FINANCE_PASSWORD ?? "SahilFinans2026!",
    displayName: "Sahil Collection Finans",
    role: "FINANCE" as const,
    companyName: "Sahil Collection Villas",
  },
];

function mapPlatformRoleToAppRole(
  platformRole: PlatformRole,
  membershipRole?: MembershipRole | null,
): AppRole {
  if (platformRole === "PLATFORM_OWNER") {
    return "SUPER_ADMIN";
  }

  if (membershipRole === "COMPANY_ADMIN") {
    return "ADMIN";
  }

  return membershipAppRole(membershipRole ?? "") ?? "STAFF";
}

function toSearchKey(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "");
}

async function resolveLoginCompany(companyName: string) {
  const normalizedQuery = toSearchKey(companyName);

  if (!normalizedQuery) {
    return null;
  }

  const companies = await getAllCompanyRecords();

  return (
    companies.find((company) =>
      [company.name, company.shortName, company.slug, company.panelLabel, company.primaryDomain].some(
        (candidate) => toSearchKey(candidate) === normalizedQuery,
      ),
    ) ?? null
  );
}

function isPlatformUser(platformRole: PlatformRole) {
  return platformRole === "PLATFORM_OWNER";
}

export async function validateUser(
  username: string,
  password: string,
  companyName?: string,
): Promise<LoginValidationResult> {
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedCompanyName = companyName?.trim() ?? "";

  return withDevelopmentFallback(
    async () => {
      const user = await db.user.findFirst({
        where: {
          OR: [{ username: normalizedUsername }, { email: normalizedUsername }],
        },
        include: {
          memberships: {
            where: { status: "ACTIVE" },
            orderBy: [{ isPrimary: "desc" }, { acceptedAt: "desc" }, { createdAt: "asc" }],
            include: {
              company: true,
            },
          },
        },
      });

      if (!user || !user.isActive) {
        return {
          ok: false,
          reason: "INVALID_CREDENTIALS",
        } satisfies LoginValidationResult;
      }

      if (!verifyPassword(user.passwordHash, password)) {
        return {
          ok: false,
          reason: "INVALID_CREDENTIALS",
        } satisfies LoginValidationResult;
      }

      const now = new Date();

      if (isPlatformUser(user.platformRole)) {
        await db.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: now,
          },
        });

        return {
          ok: true,
          user: {
            id: user.id,
            username: user.username,
            displayName: user.name,
            role: "SUPER_ADMIN",
          },
        } satisfies LoginValidationResult;
      }

      if (!normalizedCompanyName) {
        return {
          ok: false,
          reason: "COMPANY_REQUIRED",
        } satisfies LoginValidationResult;
      }

      const selectedCompany = await resolveLoginCompany(normalizedCompanyName);

      if (!selectedCompany) {
        return {
          ok: false,
          reason: "COMPANY_NOT_FOUND",
        } satisfies LoginValidationResult;
      }

      const membership =
        user.memberships.find((item) => item.companyId === selectedCompany.id) ?? null;

      if (!membership || membership.company.status !== "ACTIVE") {
        return {
          ok: false,
          reason: "COMPANY_ACCESS_DENIED",
        } satisfies LoginValidationResult;
      }

      const role = mapPlatformRoleToAppRole(user.platformRole, membership.role);

      await db.$transaction([
        db.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: now,
          },
        }),
        ...(membership
          ? [
              db.companyMembership.update({
                where: { id: membership.id },
                data: {
                  lastActiveAt: now,
                },
              }),
            ]
          : []),
      ]);

      return {
        ok: true,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.name,
          role,
          companyId: membership.companyId,
          companySlug: membership.company.slug,
          companyName: membership.company.publicName,
        },
      } satisfies LoginValidationResult;
    },
    async () => {
      const members = await getFallbackTeamUsers();
      const auth = await readDevelopmentAuth();
      const member = members.find((item) => [item.username, item.email].some((value) => value.toLowerCase() === normalizedUsername));
      let identity = auth.users.find((item) => item.id === member?.id ||
        (item.isOwner && [item.username, item.email].some((value) => value.toLowerCase() === normalizedUsername)));

      if (!identity) {
        const credential = loginCredentials.find((item) =>
          item.username.toLowerCase() === normalizedUsername ||
          ("email" in item && item.email?.toLowerCase() === normalizedUsername));
        if (!credential || credential.password !== password) return { ok: false, reason: "INVALID_CREDENTIALS" };
        // Never recreate an account that was removed or renamed by the administrator.
        if (auth.users.some((item) => item.username.toLowerCase() === credential.username.toLowerCase())) {
          return { ok: false, reason: "INVALID_CREDENTIALS" };
        }
        const company = "companyName" in credential ? await resolveLoginCompany(credential.companyName ?? "") : null;
        if (credential.role !== "SUPER_ADMIN" && (!company || company.status !== "ACTIVE")) {
          return { ok: false, reason: "COMPANY_ACCESS_DENIED" };
        }
        const id = member?.id ?? `dev-${credential.username}`;
        if (credential.role !== "SUPER_ADMIN" && !member) {
          await writeDevelopmentDataFile("demo-team-users.json", [...members, {
            id, companyId: company!.id, username: credential.username, email: `${credential.username}@local.invalid`,
            fullName: credential.displayName, phone: "", roleId: credential.role === "STAFF" ? "CONTENT" : credential.role,
            status: "ACTIVE", agencyId: "", agencyName: "", branchId: "", branchName: "", responsibility: "", lastActiveAt: "",
          }]);
        }
        identity = { id, username: credential.username, email: "email" in credential ? credential.email ?? "" : "",
          displayName: credential.displayName, passwordHash: hashPassword(password), isOwner: credential.role === "SUPER_ADMIN" };
        await registerDevelopmentIdentity(identity);
      }

      if (!verifyPassword(identity.passwordHash, password)) return { ok: false, reason: "INVALID_CREDENTIALS" };
      const user = await getDevelopmentIdentity(identity.id);
      if (!user) return { ok: false, reason: "INVALID_CREDENTIALS" };
      if (user.role === "SUPER_ADMIN") return { ok: true, user };
      if (!normalizedCompanyName) return { ok: false, reason: "COMPANY_REQUIRED" };
      const selectedCompany = await resolveLoginCompany(normalizedCompanyName);
      if (!selectedCompany) return { ok: false, reason: "COMPANY_NOT_FOUND" };
      if (selectedCompany.id !== user.companyId) return { ok: false, reason: "COMPANY_ACCESS_DENIED" };
      return { ok: true, user };
    },
  );
}
