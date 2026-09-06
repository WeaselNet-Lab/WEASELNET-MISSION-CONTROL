import { notFound } from "next/navigation";

import { MissionFile } from "@/components/mission-file";
import { getProject, projectSlugs } from "@/lib/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return projectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return {
    title: `${project.callsign} · ${project.name}`,
    description: project.summary,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return <MissionFile project={project} />;
}
