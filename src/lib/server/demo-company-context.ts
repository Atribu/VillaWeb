import "server-only";

import { cookies, headers } from "next/headers";
import {
  DEMO_COMPANY_COOKIE_NAME,
  type DemoCompanyRecord,
} from "@/lib/demo-companies";
import { getUserSession } from "@/lib/auth/server-session";
import {
  getCompanyRecordById,
  getCompanyRecordBySlug,
  getDefaultCompanyRecord,
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
  if (input?.includeAll) {
    return null;
  }

  if (input?.companyId !== undefined) {
    return input.companyId;
  }

  const scope = await getPanelCompanyScope();
  return scope.companyId;
}

export async function assertPanelCompanyAccess(companyId?: string | null) {
  if (!companyId) {
    return;
  }

  const scope = await getPanelCompanyScope();

  if (scope.isSuperAdmin || !scope.companyId) {
    return;
  }

  if (scope.companyId !== companyId) {
    throw new Error("Bu kayda erisim yetkin bulunmuyor.");
  }
}

export async function getCurrentPublicCompany(): Promise<DemoCompanyRecord> {
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
}

export async function getCurrentCompanyLabel() {
  const session = await getUserSession().catch(() => null);

  if (session?.companyId) {
    return session.companyName ?? (await getCompanyRecordById(session.companyId))?.name ?? "Firma";
  }

  return null;
}
