import { NextResponse } from "next/server";
import type { DemoRoleId, DemoTeamUserStatus } from "@/lib/demo-users-messages";
import {
  DemoUsersMessagesStoreError,
  updateDemoTeamUser,
} from "@/lib/server/demo-users-messages-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoTeamUserStatus>(["ACTIVE", "INVITED", "PASSIVE"]);
const ALLOWED_ROLES = new Set<DemoRoleId>([
  "ADMIN",
  "SALES",
  "OPERATIONS",
  "FINANCE",
  "CRM",
  "CONTENT",
]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status?: DemoTeamUserStatus;
      roleId?: DemoRoleId;
      branchId?: string;
      responsibility?: string;
    };

    if (
      payload.status !== undefined &&
      !ALLOWED_STATUSES.has(payload.status)
    ) {
      throw new DemoUsersMessagesStoreError("Gecerli bir kullanici durumu secilmelidir.");
    }

    if (
      payload.roleId !== undefined &&
      !ALLOWED_ROLES.has(payload.roleId)
    ) {
      throw new DemoUsersMessagesStoreError("Gecerli bir rol secilmelidir.");
    }

    if (
      payload.status === undefined &&
      payload.roleId === undefined &&
      payload.branchId === undefined &&
      payload.responsibility === undefined
    ) {
      throw new DemoUsersMessagesStoreError("Guncellenecek en az bir alan secilmelidir.");
    }

    const user = await updateDemoTeamUser(id, payload);

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof DemoUsersMessagesStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Kullanici guncellenirken hata olustu." }, { status: 500 });
  }
}
