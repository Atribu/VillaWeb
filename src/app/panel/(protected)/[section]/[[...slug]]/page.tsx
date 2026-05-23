import { notFound } from "next/navigation";
import { PanelModuleShell } from "@/components/panel/panel-module-shell";
import { getPanelModuleMeta, isPlaceholderPanelSection } from "@/lib/auth/panel-access";

type PageProps = {
  params: Promise<{
    section: string;
    slug?: string[];
  }>;
};

export default async function PanelPlaceholderModulePage({ params }: PageProps) {
  const { section, slug } = await params;

  if (!isPlaceholderPanelSection(section)) {
    notFound();
  }

  const meta = getPanelModuleMeta(section, slug);

  if (!meta) {
    notFound();
  }

  return <PanelModuleShell section={section} slug={slug} meta={meta} />;
}
