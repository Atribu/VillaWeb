import { NextResponse } from "next/server";
import type { DemoRoleId, DemoTeamUserStatus } from "@/lib/demo-users-messages";
import {
  createDemoTeamUser,
  DemoUsersMessagesStoreError,
} from "@/lib/server/demo-users-messages-store";

export const runtime = "nodejs";

const ALLOWED_STATUSES = new Set<DemoTeamUserStatus>(["ACTIVE", "INVITED", "PASSIVE"]);
const ALLOWED_ROLES = new Set<DemoRoleId>([
  "ADMIN",
  "SALES",
  "OPERATIONS",
  "FINANCE",
  "CRM",
  "CONTENT",
]);

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      fullName?: string;
      username?: string;
      email?: string;
      phone?: string;
      password?: string;
      roleId?: DemoRoleId;
      status?: DemoTeamUserStatus;
      branchId?: string;
      responsibility?: string;
    };

    if (!payload.roleId || !ALLOWED_ROLES.has(payload.roleId)) {
      throw new DemoUsersMessagesStoreError("Gecerli bir rol secilmelidir.");
    }

    if (!payload.status || !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoUsersMessagesStoreError("Gecerli bir kullanici durumu secilmelidir.");
    }

    const user = await createDemoTeamUser({
      fullName: String(payload.fullName ?? ""),
      username: String(payload.username ?? ""),
      email: String(payload.email ?? ""),
      phone: String(payload.phone ?? ""),
      password: String(payload.password ?? ""),
      roleId: payload.roleId,
      status: payload.status,
      branchId: String(payload.branchId ?? ""),
      responsibility: String(payload.responsibility ?? ""),
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof DemoUsersMessagesStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Kullanici olusturulurken hata olustu." }, { status: 500 });
  }
}
