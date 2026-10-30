export const appRoles = ["SUPER_ADMIN", "ADMIN", "STAFF", "SALES", "OPERATIONS", "FINANCE", "CRM", "CONTENT", "OWNER"] as const;
export type AppRole = (typeof appRoles)[number];
export type PanelPermission = "companies" | "users" | "settings" | "websites" | "definitions" | "external-links" | "villas" | "pricing" | "reservations" | "operations" | "finance" | "crm" | "calendar" | "dashboard" | "reports" | "workspace" | "owner";

const permissions: Record<AppRole, readonly PanelPermission[]> = {
  SUPER_ADMIN: ["companies", "users", "settings", "websites", "definitions", "external-links", "villas", "pricing", "reservations", "operations", "finance", "crm", "calendar", "dashboard", "reports"],
  ADMIN: ["users", "settings", "websites", "definitions", "external-links", "villas", "pricing", "reservations", "operations", "finance", "crm", "calendar", "dashboard", "reports"],
  STAFF: ["villas"],
  CONTENT: ["villas"],
  SALES: ["reservations", "calendar"],
  OPERATIONS: ["operations", "calendar"],
  FINANCE: ["finance"],
  CRM: ["crm"],
  OWNER: ["owner"],
};

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && appRoles.includes(value as AppRole);
}

export function hasPermission(role: AppRole, permission: PanelPermission) {
  if (permission === "workspace") return isAppRole(role) && role !== "OWNER";
  return permissions[role]?.includes(permission) ?? false;
}

export function membershipAppRole(role: string): AppRole | null {
  if (role === "COMPANY_ADMIN") return "ADMIN";
  if (role === "VILLA_MANAGER") return "STAFF";
  return ["SALES", "OPERATIONS", "FINANCE", "CRM", "CONTENT", "OWNER"].includes(role) ? role as AppRole : null;
}

export function panelPathPermission(pathname: string): PanelPermission | null {
  if (pathname === "/panel") return "dashboard";
  const section = pathname.split("/")[2];
  if (pathname.startsWith("/panel/ayarlar/sistem-sagligi")) return "companies";
  const sections: Record<string, PanelPermission> = {
    firmalar: "companies", personel: "users", "kullanicilar-mesajlar": "users", ayarlar: "settings",
    "web-siteleri": "websites", tanimlamalar: "definitions", "diger-linkler": "external-links",
    villalar: "villas", fiyatlar: "pricing", talepler: "reservations", rezervasyonlar: "reservations",
    "takip-operasyon": "operations", muhasebe: "finance", crm: "crm", kuponlar: "crm", indirimler: "crm",
    "takvim-senkronizasyon": "calendar", takvim: "calendar", raporlar: "reports",
    "is-merkezi": "workspace", "satis-takibi": "reservations", "villa-sahibi": "owner", "villa-sahipleri": "users",
  };
  return sections[section] ?? null;
}
