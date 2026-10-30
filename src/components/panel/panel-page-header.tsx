import type { ReactNode } from "react";

export function PanelPageHeader({ eyebrow, title, description, actions }: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return <header className="panel-page-header">
    <div className="min-w-0">
      <p className="panel-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="panel-page-description">{description}</p>
    </div>
    {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
  </header>;
}
