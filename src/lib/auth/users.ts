import { timingSafeEqual, scryptSync } from "node:crypto";
import "server-only";

import type { MembershipRole, PlatformRole } from "@prisma/client";
import { db } from "@/lib/db";
import { getAllCompanyRecords } from "@/lib/server/company-store";
import { withDevelopmentFallback } from "@/lib/server/development-fallback";

export type AppRole = "SUPER_ADMIN" | "ADMIN" | "STAFF";

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
    role: "STAFF" as const,
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

  return "STAFF";
}

function verifyScryptPassword(storedHash: string, password: string) {
  const [algorithm, salt, hash] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const derived = scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "hex");

  if (derived.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(derived, stored);
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

      if (!verifyScryptPassword(user.passwordHash, password)) {
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

      if (!membership) {
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
      const credential = loginCredentials.find(
        (item) =>
          item.username.toLowerCase() === normalizedUsername ||
          ("email" in item &&
            typeof item.email === "string" &&
            item.email.toLowerCase() === normalizedUsername),
      );

      if (!credential || credential.password !== password) {
        return {
          ok: false,
          reason: "INVALID_CREDENTIALS",
        } satisfies LoginValidationResult;
      }

      if (credential.role === "SUPER_ADMIN") {
        return {
          ok: true,
          user: {
            id: `dev-${credential.username}`,
            username: credential.username,
            displayName: credential.displayName,
            role: credential.role,
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

      const company = credential.companyName
        ? await resolveLoginCompany(credential.companyName)
        : null;

      if (!company || company.id !== selectedCompany.id) {
        return {
          ok: false,
          reason: "COMPANY_ACCESS_DENIED",
        } satisfies LoginValidationResult;
      }

      return {
        ok: true,
        user: {
          id: `dev-${credential.username}`,
          username: credential.username,
          displayName: credential.displayName,
          role: credential.role,
          companyId: company.id,
          companySlug: company.slug,
          companyName: company.name,
        },
      } satisfies LoginValidationResult;
    },
  );
}
