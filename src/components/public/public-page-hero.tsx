import type { ReactNode } from "react";
import Link from "next/link";

type HeroAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type PublicPageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  backgroundImage?: string;
  actions?: HeroAction[];
  children?: ReactNode;
};

export function PublicPageHero({
  eyebrow,
  title,
  description,
  backgroundImage,
  actions = [],
  children,
}: PublicPageHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[var(--serene-primary)] text-white shadow-[0_22px_48px_rgba(26,54,93,0.16)]">
      {backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-[#001b3c]/86 via-[#001b3c]/58 to-[#1a365d]/34" />
      <div className="relative z-10 px-7 py-10 sm:px-10 sm:py-12">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--serene-tertiary-soft)]">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl lg:text-[3.75rem]">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-8 text-white/78 sm:text-base">
            {description}
          </p>

          {actions.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {actions.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className={
                    action.variant === "secondary"
                      ? "inline-flex items-center justify-center rounded-[8px] border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-[var(--serene-tertiary-soft)]"
                      : "inline-flex items-center justify-center rounded-[8px] bg-white px-5 py-3 text-sm font-semibold text-[var(--serene-primary)] transition hover:bg-[var(--serene-primary-soft)]"
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
