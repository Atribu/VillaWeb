import { notFound } from "next/navigation";
import { DesignDemo } from "@/components/design-demos/design-demo";
import { isConcept } from "@/components/design-demos/demo-data";

export default async function DesignDemoPage({ params }: { params: Promise<{ concept: string }> }) {
  const { concept } = await params;
  if (!isConcept(concept)) notFound();
  return <DesignDemo key={concept} concept={concept} />;
}
