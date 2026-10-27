import type { ReactNode } from "react";

export function SiteIcon({ name, className }: { name: "arrow" | "home" | "search" | "pin" | "people" | "bed" | "sun" | "menu" | "close" | "check" | "grid" | "filter" | "bath" | "calendar"; className?: string }) {
  const paths: Record<typeof name, ReactNode> = {
    arrow: <path d="M4 12h15M13 5l7 7-7 7" />,
    home: <><path d="M2 16c4-6 6 6 10 0s6 6 10 0M2 21c4-6 6 6 10 0s6 6 10 0M5 11l7-8 7 8M8 10v4M16 10v4" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    people: <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v3" /></>,
    bed: <path d="M3 19V8M21 19V8M3 15h18M3 10h18v5H3zM6 10V5h12v5" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2" /></>,
    menu: <path d="M3 7h18M3 12h18M3 17h18" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    grid: <><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="3" width="6" height="6" rx="1" /><rect x="3" y="15" width="6" height="6" rx="1" /><rect x="15" y="15" width="6" height="6" rx="1" /></>,
    filter: <><path d="M3 6h7m4 0h7M3 18h11m4 0h3M10 3v6M14 15v6M3 12h3m4 0h11M6 9v6" /></>,
    bath: <><path d="M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM5 12V5a2 2 0 0 1 4 0M6 19v2M18 19v2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M7 14h3M14 14h3" /></>,
  };
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
