import { notFound, redirect } from "next/navigation";

import { MissionFile } from "@/components/mission-file";
import { loadOwnerBundle } from "@/lib/owner/load";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const bundle = await loadOwnerBundle();
  if (!bundle) redirect("/login");
  const { slug } = await params;
  const project = bundle.catalog.projects.find((item) => item.slug === slug);
  if (!project) notFound();
  return <MissionFile project={project} />;
}
