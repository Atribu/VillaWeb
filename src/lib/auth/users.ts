import { timingSafeEqual, scryptSync } from "node:crypto";
import "server-only";

import type { MembershipRole, PlatformRole } from "@prisma/client";
import { db } from "@/lib/db";
import { getDemoCompanies } from "@/lib/demo-companies";
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

export const loginCredentials = [
  {
    username: process.env.SEED_SUPER_ADMIN_USERNAME ?? process.env.SUPER_ADMIN_USERNAME ?? "super-admin",
    password:
      process.env.SEED_SUPER_ADMIN_PASSWORD ?? process.env.SUPER_ADMIN_PASSWORD ?? "VillaSuper2026!",
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
  if (platformRole === "PLATFORM_OWNER" || platformRole === "PLATFORM_ADMIN") {
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

export async function validateUser(username: string, password: string): Promise<AppUser | null> {
  const normalizedUsername = username.trim().toLowerCase();

  return withDevelopmentFallback(
    async () => {
      const user = await db.user.findUnique({
        where: { username: normalizedUsername },
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
        return null;
      }

      if (!verifyScryptPassword(user.passwordHash, password)) {
        return null;
      }

      const primaryMembership = user.memberships[0] ?? null;
      const role = mapPlatformRoleToAppRole(user.platformRole, primaryMembership?.role);
      const now = new Date();

      await db.$transaction([
        db.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: now,
          },
        }),
        ...(primaryMembership
          ? [
              db.companyMembership.update({
                where: { id: primaryMembership.id },
                data: {
                  lastActiveAt: now,
                },
              }),
            ]
          : []),
      ]);

      return {
        id: user.id,
        username: user.username,
        displayName: user.name,
        role,
        companyId: primaryMembership?.companyId,
        companySlug: primaryMembership?.company.slug,
        companyName: primaryMembership?.company.publicName,
      };
    },
    () => {
      const credential = loginCredentials.find((item) => item.username.toLowerCase() === normalizedUsername);

      if (!credential || credential.password !== password) {
        return null;
      }

      const company = credential.companyName
        ? getDemoCompanies().find((item) => item.name === credential.companyName)
        : null;

      return {
        id: `dev-${credential.username}`,
        username: credential.username,
        displayName: credential.displayName,
        role: credential.role,
        companyId: company?.id,
        companySlug: company?.slug,
        companyName: company?.name,
      } satisfies AppUser;
    },
  );
}
