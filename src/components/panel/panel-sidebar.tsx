"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  getPanelEntryState,
  getPanelNavigation,
  type PanelIconName,
} from "@/lib/auth/panel-access";
import type { AppRole } from "@/lib/auth/users";

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

function PanelSidebarRailButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: PanelIconName;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-r-xl border-l-4 transition",
        active
          ? "border-l-[#2b78ad] bg-[#2b78ad] text-white shadow-[0_8px_20px_rgba(43,120,173,0.24)]"
          : "border-l-transparent bg-white text-[#2b78ad] hover:bg-[#eef5fa]",
      )}
    >
      <PanelNavIcon name={icon} />
    </button>
  );
}

export function PanelSidebar({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const navigation = getPanelNavigation(role);

  const activeGroupId = useMemo(() => {
    const activeGroup = navigation.find(
      (entry) => entry.type === "group" && getPanelEntryState(pathname, entry).hasActiveChild,
    );
    return activeGroup?.id ?? null;
  }, [navigation, pathname]);

  const [manualOpenGroupId, setManualOpenGroupId] = useState<string | null>(null);

  const openGroupId = manualOpenGroupId ?? activeGroupId;
  const openGroup =
    openGroupId && navigation.find((entry) => entry.type === "group" && entry.id === openGroupId);

  return (
    <div className="flex h-full">
      <div className="flex w-[56px] flex-col border-r border-[#d7dde5] bg-[#f4f7fa] py-1">
        <div className="flex flex-1 flex-col gap-1">
          {navigation.map((entry) => {
            const state = getPanelEntryState(pathname, entry);
            const isOpen = openGroupId === entry.id;

            if (entry.type === "link") {
              return (
                <Link
                  key={entry.id}
                  href={entry.href}
                  aria-label={entry.label}
                  title={entry.label}
                  className={cn(
                    "mx-0.5 flex h-11 w-[calc(100%-4px)] items-center justify-center rounded-r-xl border-l-4 transition",
                    state.isActive
                      ? "border-l-[#2b78ad] bg-[#2b78ad] text-white shadow-[0_8px_20px_rgba(43,120,173,0.24)]"
                      : "border-l-transparent bg-white text-[#2b78ad] hover:bg-[#eef5fa]",
                  )}
                >
                  <PanelNavIcon name={entry.icon} />
                </Link>
              );
            }

            return (
              <PanelSidebarRailButton
                key={entry.id}
                active={state.hasActiveChild || isOpen}
                label={entry.label}
                icon={entry.icon}
                onClick={() =>
                  setManualOpenGroupId((current) => (current === entry.id ? null : entry.id))
                }
              />
            );
          })}
        </div>
      </div>

      {openGroup && openGroup.type === "group" ? (
        <div className="hidden w-[250px] border-r border-[#d7dde5] bg-white lg:block">
          <div className="border-b border-[#d7dde5] bg-[#2b78ad] px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <PanelNavIcon name={openGroup.icon} className="h-5 w-5" />
              <p className="text-sm font-semibold uppercase tracking-[0.08em]">{openGroup.label}</p>
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="border-l border-[#c7d1dc] pl-5">
              {openGroup.items.map((item) => {
                const active = isPathActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative block py-2.5 text-[15px] transition",
                      active
                        ? "font-medium text-[#f16824]"
                        : "text-[#5f6f83] hover:text-[#2b78ad]",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute -left-[1.45rem] top-[1.05rem] h-2.5 w-2.5 rounded-full border bg-white",
                        active ? "border-[#2b78ad] ring-2 ring-[#e8f2f8]" : "border-[#a8b4c3]",
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
