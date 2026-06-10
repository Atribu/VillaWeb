"use client";

import { startTransition, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AppLocale } from "@/lib/i18n";

type LanguageSwitcherProps = {
  locale: AppLocale;
  variant?: "dark" | "light";
  compact?: boolean;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function LanguageSwitcher({
  locale,
  variant = "dark",
  compact = false,
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const baseClassName =
    variant === "dark"
      ? "border-white/14 bg-white/8 text-white/74"
      : "border-black/8 bg-white text-slate-500";
  const activeClassName =
    variant === "dark"
      ? "bg-white text-slate-950 shadow-sm"
      : "bg-slate-950 text-white shadow-sm";
  const wrapperClassName = compact
    ? "inline-flex items-center gap-1 rounded-[10px] border p-1"
    : "inline-flex items-center gap-1 rounded-[12px] border p-1.5";
  const buttonClassName = compact
    ? "rounded-[8px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
    : "rounded-[8px] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]";

  const baseHref = useMemo(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("lang");
    const query = nextParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const handleSwitch = (nextLocale: AppLocale) => {
    if (nextLocale === locale) {
      return;
    }

    void (async () => {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      });

      startTransition(() => {
        router.replace(baseHref, { scroll: false });
        router.refresh();
      });
    })();
  };

  return (
    <div className={cn(wrapperClassName, baseClassName)}>
      {(["tr", "en"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={locale === option}
          onClick={() => handleSwitch(option)}
          className={cn(buttonClassName, locale === option ? activeClassName : "")}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
