import type { AppRole } from "@/lib/auth/users";

type PanelNavItem = {
  href: string;
  label: string;
  roles: AppRole[];
};

const panelNav: PanelNavItem[] = [
  { href: "/panel", label: "Dashboard", roles: ["ADMIN"] },
  { href: "/panel/villalar", label: "Villa Listesi", roles: ["ADMIN", "STAFF"] },
  { href: "/panel/villalar/yeni", label: "Villa Ekle", roles: ["ADMIN", "STAFF"] },
  { href: "/panel/talepler", label: "Talepler", roles: ["ADMIN"] },
  { href: "/panel/fiyatlar", label: "Fiyatlar", roles: ["ADMIN"] },
  { href: "/panel/indirimler", label: "Indirimler", roles: ["ADMIN"] },
  { href: "/panel/kuponlar", label: "Kuponlar", roles: ["ADMIN"] },
  { href: "/panel/personel", label: "Personel", roles: ["ADMIN"] },
  { href: "/panel/raporlar", label: "Raporlar", roles: ["ADMIN"] },
];

export function getPanelNavigation(role: AppRole) {
  return panelNav.filter((item) => item.roles.includes(role));
}

export function getPanelHomePath(role: AppRole) {
  return role === "ADMIN" ? "/panel" : "/panel/villalar/yeni";
}

export function canAccessPanelPath(role: AppRole, pathname: string) {
  if (role === "ADMIN") {
    return true;
  }

  if (pathname === "/panel") {
    return false;
  }

  return pathname.startsWith("/panel/villalar");
}
