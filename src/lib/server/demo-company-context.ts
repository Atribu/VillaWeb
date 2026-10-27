import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";
import {
  DEMO_COMPANY_COOKIE_NAME,
  type DemoCompanyRecord,
} from "@/lib/demo-companies";
import { getUserSession } from "@/lib/auth/server-session";
import {
  getCompanyRecordById,
  getCompanyRecordBySlug,
  getDefaultCompanyRecord,
  getCompanyRecordForHost,
} from "@/lib/server/company-store";

export type DemoCompanyScope = {
  companyId: string | null;
  isSuperAdmin: boolean;
};

async function readCompanySlugFromHeaders() {
  try {
    const headerStore = await headers();
    return headerStore.get("x-demo-company-slug");
  } catch {
    return null;
  }
}

async function readCompanySlugFromCookies() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(DEMO_COMPANY_COOKIE_NAME)?.value ?? null;
  } catch {
    return null;
  }
}

export async function getPanelCompanyScope(): Promise<DemoCompanyScope> {
  const session = await getUserSession().catch(() => null);

  if (!session) {
    return {
      companyId: null,
      isSuperAdmin: false,
    };
  }

  return {
    companyId: session.role === "SUPER_ADMIN" ? null : (session.companyId ?? null),
    isSuperAdmin: session.role === "SUPER_ADMIN",
  };
}

export async function resolvePanelCompanyId(input?: {
  companyId?: string | null;
  includeAll?: boolean;
}) {
  const scope = await getPanelCompanyScope();

  if (scope.isSuperAdmin) {
    if (input?.includeAll) {
      return null;
    }

    if (input?.companyId !== undefined) {
      return input.companyId;
    }

    return null;
  }

  if (scope.companyId) return scope.companyId;
  return input?.companyId ?? (await getCurrentPublicCompany()).id;
}

export async function assertPanelCompanyAccess(companyId?: string | null) {
  const scope = await getPanelCompanyScope();

  if (scope.isSuperAdmin) {
    return;
  }

  if (!companyId || !scope.companyId || scope.companyId !== companyId) {
    throw new Error("Bu kayda erisim yetkin bulunmuyor.");
  }
}

export async function assertSuperAdminPanelAccess() {
  const session = await getUserSession().catch(() => null);

  if (!session || session.role !== "SUPER_ADMIN") {
    throw new Error("Bu islem yalnizca super admin tarafindan kullanilabilir.");
  }
}

export const getCurrentPublicCompany = cache(async (): Promise<DemoCompanyRecord> => {
  // A registered domain is authoritative; query/cookie selection is for the shared demo host.
  const domainCompany = await getCompanyRecordForHost((await headers()).get("host") ?? "");
  if (domainCompany) return domainCompany;
  const headerSlug = await readCompanySlugFromHeaders();
  const cookieSlug = await readCompanySlugFromCookies();
  const resolved =
    (await getCompanyRecordBySlug(headerSlug)) ??
    (await getCompanyRecordBySlug(cookieSlug)) ??
    (await getDefaultCompanyRecord());

  if (!resolved) {
    throw new Error("En az bir aktif firma kaydi gereklidir.");
  }

  return resolved;
});

export async function getCurrentCompanyLabel() {
  const session = await getUserSession().catch(() => null);

  if (session?.companyId) {
    return session.companyName ?? (await getCompanyRecordById(session.companyId))?.name ?? "Firma";
  }

  return null;
}
