import type { ReactNode } from "react";
import Link from "next/link";
import { SiteIcon } from "@/components/site-templates/site-icon";
import s from "@/components/site-templates/site-templates.module.css";

type HeroAction = { href: string; label: string; variant?: "primary" | "secondary" };
type PublicPageHeroProps = { eyebrow: string; title: string; description: string; backgroundImage?: string; actions?: HeroAction[]; children?: ReactNode };

export function PublicPageHero({ eyebrow, title, description, actions = [], children }: PublicPageHeroProps) {
  return <section className={s.pageHero}>
    <div className={s.pageHeroContent}><p className={s.eyebrow}>{eyebrow}</p><h1>{title}</h1><p className={s.pageHeroDescription}>{description}</p>
      {actions.length > 0 && <div className={s.pageHeroActions}>{actions.map((action) => <Link key={`${action.href}-${action.label}`} href={action.href} className={s.textLink}>{action.label}<SiteIcon name="arrow" /></Link>)}</div>}
    </div>
    {children && <div className={s.pageHeroChildren}>{children}</div>}
  </section>;
}
