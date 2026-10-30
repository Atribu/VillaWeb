"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { type PanelIconName } from "@/lib/auth/panel-access";
import type { AppRole } from "@/lib/auth/users";
import type { AppLocale } from "@/lib/i18n";
import { getLocalizedPanelNavigation } from "@/lib/panel-i18n";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function PanelNavIcon({ name, className }: { name: PanelIconName; className?: string }) {
  const shared = {
    className: cn("h-[18px] w-[18px]", className),
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...shared}>
          <path d="M3 13.5a2 2 0 0 1 .62-1.46l6.5-6.18a2.7 2.7 0 0 1 3.76 0l6.5 6.18A2 2 0 0 1 21 13.5V19a2 2 0 0 1-2 2h-4.5v-5.5h-5V21H5a2 2 0 0 1-2-2z" />
        </svg>
      );
    case "cart":
      return (
        <svg {...shared}>
          <path d="M4 5h2l1.2 8.2a1 1 0 0 0 1 .8H18a1 1 0 0 0 1-.8L20.4 8H7.2" />
          <circle cx="10" cy="19" r="1.5" />
          <circle cx="17" cy="19" r="1.5" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...shared}>
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v2.5h-4.5a2.5 2.5 0 0 0 0 5H20V17a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5z" />
          <path d="M15.5 9.5h5v5h-5a2.5 2.5 0 0 1 0-5z" />
        </svg>
      );
    case "crm":
      return (
        <svg {...shared}>
          <path d="M7.5 14A3.5 3.5 0 1 0 7.5 7a3.5 3.5 0 0 0 0 7zM16.5 13A2.5 2.5 0 1 0 16.5 8a2.5 2.5 0 0 0 0 5z" />
          <path d="M3.5 20a4.7 4.7 0 0 1 8 0M13 20a4 4 0 0 1 7 0" />
        </svg>
      );
    case "users":
      return (
        <svg {...shared}>
          <path d="M9 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
          <path d="M4 20a5 5 0 0 1 10 0M14 20a4 4 0 0 1 6 0" />
        </svg>
      );
    case "settings":
      return (
        <svg {...shared}>
          <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5z" />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1L4.8 8a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1A2 2 0 1 1 20 8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.2z" />
        </svg>
      );
    case "lab":
      return (
        <svg {...shared}>
          <path d="M9 3v4l-4.5 7.2A3 3 0 0 0 7 19h10a3 3 0 0 0 2.5-4.8L15 7V3" />
          <path d="M9 7h6" />
        </svg>
      );
    case "globe":
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18" />
        </svg>
      );
    case "home":
      return (
        <svg {...shared}>
          <path d="M4 20V10.8a2 2 0 0 1 .73-1.55l5.5-4.55a3 3 0 0 1 3.54 0l5.5 4.55A2 2 0 0 1 20 10.8V20h-5.5v-5.5h-5V20z" />
        </svg>
      );
    case "sync":
      return (
        <svg {...shared}>
          <path d="M20 7h-5V2M4 17h5v5" />
          <path d="M6.5 18.5A8 8 0 0 1 5 7.8L7.2 5.6M17.5 5.5A8 8 0 0 1 19 16.2l-2.2 2.2" />
        </svg>
      );
    case "link":
      return (
        <svg {...shared}>
          <path d="M10 14 7.9 16.1a3 3 0 1 1-4.2-4.2L5.8 9.8a3 3 0 0 1 4.2 0" />
          <path d="M14 10 16.1 7.9a3 3 0 1 1 4.2 4.2l-2.1 2.1a3 3 0 0 1-4.2 0" />
          <path d="m8.5 15.5 7-7" />
        </svg>
      );
  }

  return null;
}

export function PanelSidebar({ role, locale }: { role: AppRole; locale: AppLocale }) {
  const pathname = usePathname();
  const navigation = getLocalizedPanelNavigation(role, locale);
  const [manualGroup, setManualGroup] = useState<{ pathname: string; id: string }>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const groups = [
    { label: locale === "en" ? "Daily workspace" : "Günlük işler", ids: ["dashboard", "workspace", "owner", "villas", "reservations", "operations"] },
    { label: locale === "en" ? "Business management" : "İşletme yönetimi", ids: ["finance", "crm", "websites", "calendar-sync"] },
    { label: locale === "en" ? "Organization & settings" : "Organizasyon ve ayarlar", ids: ["companies", "users-messages", "definitions", "settings", "external-links"] },
  ];
  const links = navigation.flatMap((entry) => entry.type === "link" ? [entry] : entry.items);
  const activeHref = links.filter((item) => isPathActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const activeGroupId = [...navigation].reverse().find((entry) => entry.type === "group"
    && entry.items.some((item) => item.href === activeHref))?.id;
  const openGroup = manualGroup?.pathname === pathname ? manualGroup.id : activeGroupId;
  return (
    <aside className="panel-navigation" data-collapsed={collapsed}>
      <button type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-controls="panel-navigation-links"
        className="flex w-full items-center justify-between text-sm font-semibold text-slate-700 lg:hidden">
        <span>{locale === "en" ? "Navigation" : "Panel menüsü"}</span><span aria-hidden="true">{mobileOpen ? "−" : "+"}</span>
      </button>
      <nav id="panel-navigation-links" aria-label="Panel" className={cn(mobileOpen ? "block" : "hidden", "mt-4 lg:mt-0 lg:block")}>
        <div className="mb-5 hidden items-center justify-between px-3 lg:flex">
          <span className="panel-nav-label text-xs font-semibold text-slate-500">{locale === "en" ? "Workspace" : "Çalışma alanı"}</span>
          <button type="button" className="panel-nav-collapse" onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed} aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"} title={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/><path d={collapsed ? "m13 9 3 3-3 3" : "m16 9-3 3 3 3"}/></svg>
          </button>
        </div>
        {groups.map((group) => {
          const entries = group.ids.flatMap((id) => navigation.filter((entry) => entry.id === id));
          if (!entries.length) return null;
          return <div key={group.label} className="panel-nav-group">
            <p className="panel-nav-heading">{group.label}</p>
            <div className="space-y-1">
          {entries.map((entry) => {
            const active = entry.type === "link" ? activeHref === entry.href : activeGroupId === entry.id;
            const classes = cn("flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[13px] font-semibold transition",
              active ? "bg-[#eaf1f7] text-[#173c64]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800");
            if (entry.type === "link") return (
              <Link key={entry.id} href={entry.href} title={entry.label} aria-label={entry.label} aria-current={active ? "page" : undefined} className={classes} onClick={() => setMobileOpen(false)}>
                <PanelNavIcon name={entry.icon} className="shrink-0" /><span className="panel-nav-label">{entry.label}</span>
              </Link>
            );
            const open = openGroup === entry.id;
            return (
              <div key={entry.id}>
                <button type="button" className={classes} title={entry.label} aria-label={entry.label} aria-expanded={open && !collapsed} aria-controls={`nav-${entry.id}`} onClick={() => { setCollapsed(false); setManualGroup({ pathname, id: open && !collapsed ? "" : entry.id }); }}>
                  <PanelNavIcon name={entry.icon} className="shrink-0" /><span className="panel-nav-label flex-1">{entry.label}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" className={cn("panel-nav-label", open && "rotate-180")} aria-hidden="true"><path d="m3 4.5 3 3 3-3" /></svg>
                </button>
                {open ? <div id={`nav-${entry.id}`} className="panel-nav-children my-2 ml-5 space-y-1 border-l border-slate-200 pl-4">
                  {entry.items.filter((item) => entry.id !== "definitions" || item.href !== "/panel/villalar").map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                    aria-current={activeHref === item.href ? "page" : undefined}
                    className={cn("block rounded-md px-3 py-2 text-[13px] transition", activeHref === item.href ? "bg-[#f0f5f9] font-semibold text-[#173c64]" : "text-slate-500 hover:text-slate-900")}>
                    {item.label}
                  </Link>)}
                </div> : null}
              </div>
            );
          })}
            </div>
          </div>;
        })}
        <div className="panel-nav-label mt-8 border-t border-slate-100 px-3 pt-5"><p className="text-xs font-semibold text-slate-600">BookToVilla</p><p className="mt-1 text-[11px] text-slate-400">Villa ve rezervasyon yönetimi</p></div>
      </nav>
    </aside>
  );
}
